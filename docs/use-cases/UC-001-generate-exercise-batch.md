# UC-001: Generate Exercise (Batch)

`GenerateExerciseBatchUseCase`

## Actor Principal

Sistema (proceso batch en `ai-engine`, sin usuario directo).

## Trigger

Ejecución programada del proceso de generación batch, o detección de que el Exercise Pool tiene pocos ejercicios disponibles para una combinación (Tema, AcademicLevel, banda de dificultad).

## Precondiciones

- Existe un Tema válido del catálogo ([ADR-006](../ADR/ADR-006_math_topics.md)) para el AcademicLevel objetivo.

## Flujo Principal

1. El proceso batch selecciona un Tema y `AcademicLevel` con escasez de ejercicios en el Pool.
2. Construye un prompt para Qwen usando la `description` del Tema (ADR-006) y su `difficultyRange` objetivo para ese nivel.
3. Qwen genera el enunciado, opciones (si `type = Test`), respuesta correcta y explicación.
4. El sistema valida que el ejercicio generado cumple las invariantes de `Exercise` ([ADR-004](../ADR/ADR-004_domain.md)): si `type = Test`, exactamente 3 opciones y `correctAnswer ∈ options`.
5. Se persiste como `Exercise` con `difficulty` inicial = punto medio del `difficultyRange` objetivo y `generatedBy = 'ai-batch'`.

## Flujos Alternativos

- **4a. Ejercicio inválido**: el ejercicio generado no cumple las invariantes → se descarta y se reintenta (máximo N intentos) o se registra para revisión manual.

## Postcondiciones

Nuevo(s) `Exercise` disponibles en el Exercise Pool para ese Tema/AcademicLevel, listos para ser servidos por [UC-008](UC-008-select-next-exercise.md).

## Entidades involucradas

`Exercise`, Tema ([ADR-006](../ADR/ADR-006_math_topics.md)), `Difficulty` ([ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md)).

## Referencias

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — "Estrategia IA": este es el único punto donde la IA participa en la creación de contenido; no ocurre en el flujo de petición de un usuario (ver [UC-008](UC-008-select-next-exercise.md), que sí es determinista).
