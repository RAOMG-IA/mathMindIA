# ADR-014: RAG (Retrieval-Augmented Generation) sobre material de referencia

## Estado

Propuesto

## Contexto

[US-008](../user-stories/US-008-subir-material-rag.md) pide que `ai-engine` consolide una base de conocimiento a partir de ficheros que un administrador del sistema deposita en un directorio local, para que [UC-001](../use-cases/UC-001-generate-exercise-batch.md) (Generate Exercise, Batch) y [UC-003](../use-cases/UC-003-generate-hint.md) (Generate Hint) generen contenido apoyado en ese material en vez de partir solo del conocimiento general de Qwen. **Propósito del diseño**: el RAG existe para que el administrador aporte ejercicios, notas y recomendaciones de referencia — material curado que el agente usa como contexto adicional al generar, de forma que sus respuestas (ejercicios y pistas) queden más ajustadas al criterio y al estilo aportado, en vez de depender solo del conocimiento general del modelo. La historia dejó deliberadamente en "Fuera de alcance" varias decisiones técnicas para cuando se definiera el Caso de Uso: cómo asociar cada fichero a un `Tema`, el mecanismo de disparo, dónde persistir el registro de ingesta, y la tecnología de indexado vectorial. Este ADR las resuelve.

El usuario trajo la mayoría de estas decisiones ya tomadas: LangChain para indexar (loaders + text splitter + embeddings), un script disparado manualmente o por cron, ficheros movidos a un directorio de histórico tras procesarse, registro de ingesta en el PostgreSQL ya configurado (ADR-013). La elección inicial de almacén vectorial fue Chroma; al señalar que el cliente JS de LangChain para Chroma exige un servidor HTTP aparte (no existe modo embebido en Node, a diferencia de Python), se comparó explícitamente con pgvector y se optó por este último — confirmado con el usuario vía AskUserQuestion.

**Por qué esto no viola la restricción "no implementar código productivo" de `.ai/skills/architecture.md`**: este documento fija decisiones y contratos (puertos, modelo de datos declarativo), no código con lógica. El propio `database/schema.prisma` sigue siendo declarativo (mismo argumento ya usado en ADR-013).

## Decisión

### Sin tagging de ficheros a Tema en la ingesta

Se descarta cualquier convención de nombres de fichero o subcarpetas para asociar un fichero a un `Tema` ([ADR-006](ADR-006_math_topics.md)). La asociación ocurre implícitamente por similitud semántica **en el momento de generar**, no al ingerir:

- UC-001 construye la query de recuperación a partir de `Tema.code` + `Tema.description` + `AcademicLevel`.
- UC-003 construye la query a partir de `Exercise.topic` + `Exercise.statement` (más específico, ya existe un ejercicio concreto).

Esto resuelve el hueco de "Fuera de alcance" de US-008 sin necesidad de metadata adicional en la ingesta ni de un paso de clasificación.

### Embeddings: modelo local, sin API externa

`@langchain/community` + `@xenova/transformers`, modelo tipo `Xenova/all-MiniLM-L6-v2` (384 dimensiones), ejecutado en el propio proceso de Node. No depende de red, no consume cuota de `QWEN_API_KEY`. Judgment call: el nombre exacto del modelo se confirma al implementar (mismo criterio que otras constantes documentadas como judgment call en la sesión, p.ej. `MAX_ATTEMPTS` de UC-001).

### Almacén vectorial: pgvector, no Chroma

Extensión `vector` de PostgreSQL, sobre el mismo `DATABASE_URL` ya configurado y verificado con persistencia real ([STATUS.md #31](../STATUS.md)). Motivos, confirmados con el usuario tras comparar explícitamente ambas opciones:

- Cero procesos/servicios nuevos que levantar — Chroma exigiría un servidor HTTP aparte (sin modo embebido en Node), justo el tipo de pieza adicional ya descartada para Postgres al rechazar Docker por ser un entorno mono-servidor (ver adenda 2026-08-07 de este mismo ADR-013).
- Consistencia transaccional: los embeddings y el registro de ingesta pueden escribirse en la misma base, potencialmente en la misma transacción — con Chroma quedarían en almacenes separados, con riesgo de desincronización si uno de los dos escribe y el otro falla.
- Un solo mecanismo de backup/restore (`pg_dump`) para datos relacionales y vectores.

**Concesión documentada**: Prisma no tiene operadores de distancia vectorial en su query builder tipado. La columna `vector` se declara como `Unsupported("vector(384)")` (invisible al cliente generado) y tanto la escritura como la búsqueda por similitud se hacen con SQL crudo (`$executeRaw`/`$queryRaw`) — patrón estándar de Prisma para tipos de columna que no soporta nativamente, no un caso especial de este proyecto.

### Formatos soportados en v1

Texto plano y Markdown (`.txt`, `.md`). PDF/DOCX quedan fuera de alcance de v1 — requerirían librerías de extracción adicionales (`pdf-parse`, `mammoth`), desproporcionado para la primera iteración. Judgment call documentado, igual que otros límites de alcance ya fijados en la sesión (p.ej. `timeLimitMs` de ejercicios generados por IA).

### Modelo de datos (Postgres, vía Prisma)

Dos modelos nuevos en `database/schema.prisma`, mismas convenciones que ADR-013 (`String @id @default(uuid())`, `@map` a snake_case, `@@map` para el nombre de tabla):

- **`RagIngestionRecord`** (`rag_ingestion_records`): un registro por fichero procesado — `id`, `fileName`, `status` (enum `RagIngestionStatus`: `Processed @map("processed")` / `Error @map("error")`, mismo patrón que `GeneratedBy`), `errorMessage` (nullable), `chunkCount`, `processedAt`.
- **`RagChunk`** (`rag_chunks`): un chunk embebido por fila — `id`, `ingestionRecordId` (FK a `RagIngestionRecord`), `chunkIndex`, `content` (texto del chunk, se conserva para poder interpolarlo en el prompt sin tener que decodificar el vector), `embedding Unsupported("vector(384)")`.

No hay FK a `Tema` ni a `Exercise` — coherente con "sin tagging en la ingesta" de arriba.

### Nuevos puertos (`packages/shared-domain`)

Mismo patrón que `IdGenerator`/`Clock`/`HintUsageTracker` (contratos sin implementación, consumidos por Casos de Uso vía inyección de dependencias):

- **`RagIngestionRepository`**: `save(record: RagIngestionRecord): Promise<void>`.
- **`KnowledgeBaseIndex`**: `index(chunks: readonly {content: string; embedding: readonly number[]}[]): Promise<void>` y `search(queryEmbedding: readonly number[], topK: number): Promise<readonly string[]>`. El puerto es agnóstico de la tecnología de almacenamiento — pgvector es una decisión de este ADR, no del puerto, que podría reimplementarse sobre otro almacén sin tocar `ai-engine`.
- **Acceso a ficheros** (interfaz mínima, ubicación a definir junto al Caso de Uso): listar directorio de entrada, leer contenido, mover a directorio de histórico.

Las implementaciones reales (Prisma/pgvector, sistema de ficheros) viven en `apps/backend-api/src/infrastructure`, mismo patrón que los `Prisma*Repository` ya implementados — `ai-engine` sigue sin conocer Prisma ni Postgres directamente, solo los puertos de `shared-domain`.

### Caso de Uso de ingesta (`ai-engine`)

Nuevo [UC-011](../use-cases/UC-011-ingest-knowledge-base.md), mismo patrón que `GenerateExerciseBatchUseCase`: listar directorio de entrada → leer cada fichero → dividir en chunks (`RecursiveCharacterTextSplitter` de LangChain; tamaño/overlap exactos son judgment call de implementación) → generar embeddings → guardar chunks vía `KnowledgeBaseIndex` → registrar el fichero vía `RagIngestionRepository` → mover el fichero al directorio de histórico. Disparado por un script (implementación de Developer/DevOps Agent cuando se aborde, no de este ADR), opcionalmente programado por cron.

### Retrieval conectado a UC-001/UC-003

`GenerateExerciseInput`/`GenerateHintInput` (`apps/ai-engine/src/prompts`) ganan un campo opcional `context?: readonly string[]`, interpolado por `buildGenerateExercisePrompt`/`buildGenerateHintPrompt` cuando está presente, sin romper el contrato de salida JSON-only ya establecido (ADR-001, adenda Zod). `ChatModel`/`LangChainQwenModel` no cambian — siguen recibiendo un único `string` como hoy.

`GenerateExerciseBatchUseCase` y `QwenHintGenerator` reciben `KnowledgeBaseIndex` inyectado, construyen la query de recuperación (ver "Sin tagging" arriba), llaman `search()` y pasan el resultado como `context`. Si no hay resultados (`Tema` sin material consolidado), `context` se omite — el ejercicio/pista se genera igual que hoy, sin caso especial ni fallo (cubre el AC "Tema sin material consolidado sigue funcionando" de US-008 de forma natural).

## Consecuencias

### Positivas

- Cierra los cuatro huecos que US-008 dejó explícitamente pendientes para Architecture.
- Reutiliza al máximo lo ya construido: mismo Postgres, mismo patrón de puertos/Casos de Uso que el resto del proyecto, sin introducir un segundo almacén de datos ni un segundo proceso servidor.
- El AC "Tema sin material sigue funcionando" no necesita lógica condicional especial — es el comportamiento natural de un `context` opcional vacío.

### Negativas / Riesgos

- Prisma no soporta nativamente el tipo `vector` — toda la escritura/lectura de `RagChunk.embedding` pasa por SQL crudo, fuera del query builder tipado habitual del resto del proyecto.
- **Riesgo de seguridad heredado, no mitigado aquí**: el contenido de un fichero ingerido entra en el contexto que se envía a Qwen — la misma vía de prompt injection ya señalada en [ADR-012](ADR-012_linea_base_seguridad.md) para UC-001/UC-003 (que hoy solo contempla el prompt del usuario y el catálogo de Temas como vectores de entrada), ahora con una tercera fuente de contenido no confiable. Señalado explícitamente para Security Agent — este ADR no propone una mitigación.
- Sin reintento automático de ficheros en estado `Error` — se define al implementar (ya señalado como fuera de alcance en US-008).

## Fuera de alcance

- Escribir el Caso de Uso, los adaptadores (pgvector, sistema de ficheros) o sus tests — ciclo TDD posterior (Test Agent → Developer Agent), no de este ADR.
- Instalar dependencias (`@langchain/community`, `@xenova/transformers`, habilitar la extensión `vector` en Postgres) — se hace al implementar.
- El script de disparo y su programación por cron — implementación de Developer/DevOps Agent.
- Migrar `RagIngestionRecord`/`RagChunk` a la base real (`prisma db push`/`migrate`) — se aplica al implementar, mismo patrón que el resto del schema (ver ADR-013).
- Mitigar el riesgo de prompt injection señalado arriba — Security Agent.
- Reintento de ficheros en estado `Error`, tamaño máximo de fichero, soporte de PDF/DOCX — se definen al implementar o en una iteración posterior.

## Trazabilidad

Registrado en `.ai/prompts/architecture.md`.
