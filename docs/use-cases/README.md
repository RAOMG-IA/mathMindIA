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

## Notas de trazabilidad / desviaciones respecto a STATUS.md

- **UC-001 se dividió en dos**: la lista original de STATUS.md tenía un único "UC-001 Generate Exercise" que mezclaba generación batch por IA (offline) y selección en tiempo real del siguiente ejercicio (determinista, sin IA — regla de [ARCHITECTURE.md](../../ARCHITECTURE.md) "la IA no participa en cada petición"). Son actores y triggers distintos, así que se mantiene **UC-001 Generate Exercise (Batch)** y se añade **UC-008 Select Next Exercise** para el flujo real que ocurre en cada sesión de usuario.
- **UC-007 Get User Statistics es nuevo**: no existía en la lista original; cierra el hueco detectado al escribir [US-007](../user-stories/US-007-ver-estadisticas.md), que no tenía caso de uso asignado.
- **UC-004 no repite las fórmulas**: su diseño algorítmico detallado (Expected score, factor K, actualización de ratings) ya está en [ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md); este documento solo da la especificación de caso de uso estándar y enlaza a ADR-005 como fuente autoritativa.

Registrado en `.ai/prompts/architecture.md`.
