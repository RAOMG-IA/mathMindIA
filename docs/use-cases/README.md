# Casos de Uso

Especificación de los Casos de Uso de MathMind AI, formalizados por el Architecture Agent ([ADR-002](../ADR-002_Agentes.md)) a partir de las [User Stories](../user-stories/). Formato: Actor, Trigger, Precondiciones, Flujo Principal, Flujos Alternativos, Postcondiciones, Entidades involucradas — sin implementación (restricción de [.ai/skills/architecture.md](../../.ai/skills/architecture.md)).

Los nombres de clase (`XxxUseCase`) siguen los ejemplos ya fijados en [ARCHITECTURE.md](../../ARCHITECTURE.md) (capa Application).

## Índice

| ID | Nombre | Actor | Historia relacionada |
|---|---|---|---|
| [UC-001](UC-001-generate-exercise-batch.md) | Generate Exercise (Batch) | Sistema (ai-engine, proceso batch) | — (sustenta US-003/US-004 indirectamente) |
| [UC-002](UC-002-validate-answer.md) | Validate Answer | Usuario | US-004 |
| [UC-003](UC-003-generate-hint.md) | Generate Hint | Usuario | US-005 |
| [UC-004](UC-004-update-difficulty.md) | Update Difficulty | Sistema (invocado por UC-002) | US-004 (implícito) |
| [UC-005](UC-005-start-session.md) | Start Session | Usuario | US-003 |
| [UC-006](UC-006-end-session.md) | End Session | Usuario | US-006 |
| [UC-007](UC-007-get-user-statistics.md) | Get User Statistics | Usuario | US-007 |
| [UC-008](UC-008-select-next-exercise.md) | Select Next Exercise | Usuario (vía backend-api) | US-003, US-004 |
| [UC-009](UC-009-register.md) | Register | Visitante | US-001 |
| [UC-010](UC-010-login.md) | Login | Usuario registrado | US-002 |
| [UC-011](UC-011-ingest-knowledge-base.md) | Ingest Knowledge Base (RAG) | Sistema (script de ingesta) | US-008 |

## Notas de trazabilidad / desviaciones respecto a STATUS.md

- **UC-001 se dividió en dos**: la lista original de STATUS.md tenía un único "UC-001 Generate Exercise" que mezclaba generación batch por IA (offline) y selección en tiempo real del siguiente ejercicio (determinista, sin IA — regla de [ARCHITECTURE.md](../../ARCHITECTURE.md) "la IA no participa en cada petición"). Son actores y triggers distintos, así que se mantiene **UC-001 Generate Exercise (Batch)** y se añade **UC-008 Select Next Exercise** para el flujo real que ocurre en cada sesión de usuario.
- **UC-007 Get User Statistics es nuevo**: no existía en la lista original; cierra el hueco detectado al escribir [US-007](../user-stories/US-007-ver-estadisticas.md), que no tenía caso de uso asignado.
- **UC-004 no repite las fórmulas**: su diseño algorítmico detallado (Expected score, factor K, actualización de ratings) ya está en [ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md); este documento solo da la especificación de caso de uso estándar y enlaza a ADR-005 como fuente autoritativa.
- **UC-009/UC-010 son nuevos**: mismo motivo que UC-007 — [US-001](../user-stories/US-001-registro.md) y [US-002](../user-stories/US-002-login.md) nunca tuvieron Caso de Uso asignado, hueco detectado al empezar a construir los Controllers reales (`AuthController` no podía implementarse sin este diseño previo, TDD Enforcement Rule).
- **UC-011 es nuevo**: cierra el hueco de [US-008](../user-stories/US-008-subir-material-rag.md) ("sin caso de uso"), ver [ADR-014](../ADR/ADR-014_rag.md). No es un actor de aplicación (`User`) — es un script, mismo criterio de "Sistema" que UC-001. UC-001 y UC-003 se amendaron con un paso de recuperación de contexto (retrieval) sobre lo que UC-011 consolida, sin convertirse en Casos de Uso nuevos: el retrieval no tiene actor/trigger propio, es un paso interno de sus flujos ya existentes.

Registrado en `.ai/prompts/architecture.md`.
