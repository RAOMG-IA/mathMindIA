# UC-011: Ingest Knowledge Base (RAG)

`IngestKnowledgeBaseUseCase`

## Actor Principal

Sistema (script de ingesta, sin usuario directo — quien lo ejecuta ya necesita acceso al servidor, es implícitamente administrador del sistema, ver [US-008](../user-stories/US-008-subir-material-rag.md)).

## Trigger

Ejecución del script de ingesta — manual, o programada por cron (intervalo configurable).

## Precondiciones

- Los directorios de entrada y de histórico están configurados (`RAG_INPUT_DIR`, `RAG_HISTORY_DIR`).
- PostgreSQL accesible con la extensión `vector` habilitada ([ADR-014](../ADR/ADR-014_rag.md)).

## Flujo Principal

1. El script lista los ficheros del directorio de entrada.
2. Para cada fichero, en orden: lee su contenido.
3. Divide el contenido en chunks (text splitter).
4. Genera un embedding local para cada chunk (sin llamada a red, [ADR-014](../ADR/ADR-014_rag.md)).
5. Guarda los chunks embebidos vía `KnowledgeBaseIndex`.
6. Registra un `RagIngestionRecord` con estado `Processed` y el número de chunks generados.
7. Mueve el fichero al directorio de histórico.
8. Continúa con el siguiente fichero del directorio de entrada.

## Flujos Alternativos

- **1a. Directorio de entrada vacío**: el script termina sin generar ningún registro ni error.
- **2a. Fichero de formato no soportado o corrupto**: no se generan chunks ni embeddings; se registra un `RagIngestionRecord` con estado `Error` y el motivo; el fichero se mueve igualmente al directorio de histórico (para no bloquear ejecuciones futuras del script sobre el mismo fichero); el procesado continúa con el siguiente fichero sin interrumpirse.

## Postcondiciones

Los chunks embebidos del fichero quedan disponibles para recuperación por similitud semántica desde [UC-001](UC-001-generate-exercise-batch.md) y [UC-003](UC-003-generate-hint.md). Cada fichero procesado (con éxito o con error) tiene un `RagIngestionRecord` y ya no está en el directorio de entrada.

**Propósito**: el administrador aporta ejercicios, notas y recomendaciones de referencia a través de este flujo para que, a partir de ese momento, el agente (UC-001/UC-003) genere ejercicios y pistas más ajustados a ese criterio — no solo al conocimiento general del modelo.

## Entidades involucradas

`RagIngestionRecord`, `RagChunk` ([ADR-014](../ADR/ADR-014_rag.md)), puertos `KnowledgeBaseIndex` y `RagIngestionRepository`.

## Referencias

- [US-008](../user-stories/US-008-subir-material-rag.md) — historia de producto que origina este Caso de Uso.
- [ADR-014](../ADR/ADR-014_rag.md) — decisiones técnicas (embeddings locales, pgvector, formatos soportados en v1, ausencia de tagging Tema↔fichero en la ingesta).
- [UC-001](UC-001-generate-exercise-batch.md) y [UC-003](UC-003-generate-hint.md) — consumidores del material consolidado aquí, vía retrieval en el momento de generar.
