# UC-001: Generate Exercise (Batch)
 
 ## Cambios recientes

- Se añadió un parámetro opcional `count` al contrato de generación. Cuando `count` > 1 el sistema
	solicitará al modelo un arreglo con `count` ejercicios en una sola llamada para reducir
	el impacto de rate limits durante cargas iniciales.
- El Caso de Uso ahora puede recibir `count` en su input y persiste todos los ejercicios válidos
	devueltos por el modelo. Los ejercicios inválidos se reintentan en bloques hasta `MAX_ATTEMPTS`.
- La validación y las invariantes de dominio (`type='Test'` => 3 opciones y `correctAnswer ∈ options`)
	siguen aplicándose; solo se persisten ejercicios que cumplen las invariantes.
- **(2026-08-11)** Con `count > 1`, la `difficulty` de cada ejercicio ya no es un único valor fijo
	(el punto medio del `difficultyRange`) repetido para los `count` — se reparte de forma determinista
	a lo largo del rango (`min` → `max`, equiespaciado). Hueco real detectado: con todos los ejercicios
	de un mismo lote empatados en dificultad exacta, [UC-008](UC-008-select-next-exercise.md) (que
	elige "el más cercano al rating" y, ante empate, siempre el primero) devolvía siempre el mismo
	ejercicio como "siguiente" — indistinguible de un botón roto para el usuario.
- **(2026-08-11)** Ahora también se invoca desde `AnswerController` bajo demanda (UC-008 flujo 2b) cuando
	el Exercise Pool se agota para un Tema/nivel/`type` en tiempo real, no solo desde el proceso batch
	programado — ver referencia actualizada más abajo.

`GenerateExerciseBatchUseCase`

## Actor Principal

Sistema (proceso batch en `ai-engine`, sin usuario directo).

## Trigger

Ejecución programada del proceso de generación batch, o detección de que el Exercise Pool tiene pocos ejercicios disponibles para una combinación (Tema, AcademicLevel, banda de dificultad).

## Precondiciones

- Existe un Tema válido del catálogo ([ADR-006](../ADR/ADR-006_math_topics.md)) para el AcademicLevel objetivo.

## Flujo Principal

1. El proceso batch selecciona un Tema y `AcademicLevel` con escasez de ejercicios en el Pool.
2. Recupera material de referencia relevante (si existe) de la base de conocimiento, construyendo la query a partir del `code` y la `description` del Tema y el `AcademicLevel` ([UC-011](UC-011-ingest-knowledge-base.md), [ADR-014](../ADR/ADR-014_rag.md)).
3. Construye un prompt para Qwen usando la `description` del Tema (ADR-006), su `difficultyRange` objetivo para ese nivel, y el material recuperado en el paso anterior (si lo hay).
4. Qwen genera el enunciado, opciones (si `type = Test`), respuesta correcta y explicación.
5. El sistema valida que el ejercicio generado cumple las invariantes de `Exercise` ([ADR-004](../ADR/ADR-004_domain.md)): si `type = Test`, exactamente 3 opciones y `correctAnswer ∈ options`.
6. Se persiste como `Exercise` con `difficulty` inicial = punto medio del `difficultyRange` objetivo y `generatedBy = 'ai-batch'`.

## Flujos Alternativos

- **2a. Sin material de referencia disponible**: la recuperación no devuelve resultados (Tema sin material consolidado todavía, [US-008](../user-stories/US-008-subir-material-rag.md)) → el prompt se construye igual que hoy, sin contexto adicional, sin fallar.
- **5a. Ejercicio inválido**: el ejercicio generado no cumple las invariantes → se descarta y se reintenta (máximo N intentos) o se registra para revisión manual.

## Postcondiciones

Nuevo(s) `Exercise` disponibles en el Exercise Pool para ese Tema/AcademicLevel, listos para ser servidos por [UC-008](UC-008-select-next-exercise.md).

## Entidades involucradas

`Exercise`, Tema ([ADR-006](../ADR/ADR-006_math_topics.md)), `Difficulty` ([ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md)), puerto `KnowledgeBaseIndex` ([ADR-014](../ADR/ADR-014_rag.md)).

## Referencias

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — "Estrategia IA": punto principal donde la IA participa en la creación de contenido. [UC-008](UC-008-select-next-exercise.md) sigue siendo determinista en su camino feliz; desde 2026-08-11 puede disparar este UC como último recurso (flujo 2b) cuando el Pool se agota en tiempo real, no solo desde el proceso batch programado.
- [ADR-014](../ADR/ADR-014_rag.md) — retrieval del material consolidado por [UC-011](UC-011-ingest-knowledge-base.md).
