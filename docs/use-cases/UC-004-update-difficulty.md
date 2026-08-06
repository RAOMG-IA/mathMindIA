# UC-004: Update Difficulty

`UpdateDifficultyUseCase`

## Actor Principal

Sistema (invocado internamente por [UC-002 Validate Answer](UC-002-validate-answer.md), paso 5).

## Trigger

Se acaba de registrar un `Answer`.

## Precondiciones

- `Answer` recién creado.
- `userRating` y `exerciseRating` disponibles para el usuario y el ejercicio respondido.

## Flujo Principal

El diseño algorítmico detallado (resultado esperado, resultado real con crédito parcial por velocidad, factor K modulado por racha, actualización simétrica de `userRating` y `exerciseRating`) está definido íntegramente en **[ADR-005: Adaptive Difficulty Engine](../ADR/ADR-005-adaptive-difficulty-engine.md)**, incluyendo su diagrama de secuencia. No se repite aquí para no duplicar la fuente autoritativa.

Resumen a nivel de caso de uso:

1. Obtener `userRating`, `exerciseRating` y `currentStreak` vigentes.
2. Invocar `AdaptiveDifficultyEngine.computeNextDifficulty(...)` (interfaz definida en ADR-005).
3. Persistir `nextUserRating`; persistir `nextExerciseRating` (puede ser asíncrono/batch).
4. Devolver `nextUserRating` a `UC-002` como "Next Difficulty".

## Flujos Alternativos

Ninguno a nivel de caso de uso — el servicio de dominio es una función pura (ver ADR-005 para casos límite como cold start).

## Postcondiciones

`nextUserRating` y `nextExerciseRating` persistidos.

## Entidades involucradas

`User`, `Exercise`, `Answer` ([ADR-004](../ADR/ADR-004_domain.md)); `Difficulty`, `AdaptiveDifficultyEngine` ([ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md)).

## Referencias

- [ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md) — fuente autoritativa del algoritmo.
