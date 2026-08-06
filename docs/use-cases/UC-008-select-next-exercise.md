# UC-008: Select Next Exercise

`SelectNextExerciseUseCase`

> Caso de uso nuevo, separado de UC-001. La lista original de STATUS.md tenía un único "UC-001 Generate Exercise" que mezclaba generación batch por IA (offline) y selección en tiempo real (determinista) del siguiente ejercicio para un usuario. Son actores y triggers distintos — ver nota en [README](README.md).

## Actor Principal

Usuario (vía `backend-api`).

## Trigger

El usuario inicia una sesión de entrenamiento ([UC-005](UC-005-start-session.md)) o responde un ejercicio dentro de una sesión activa ([UC-002](UC-002-validate-answer.md)).

## Precondiciones

- `Session` activa.
- Existe al menos un `Exercise` en el Pool para el Tema/`AcademicLevel` de la sesión, dentro de alguna banda de tolerancia alrededor del `userRating`.

## Flujo Principal

1. El sistema obtiene el `userRating` actual del usuario para el `AcademicLevel` de la sesión ([ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md)).
2. Consulta el Exercise Pool filtrando por el Tema de la sesión y `exerciseRating` dentro de ±150 del `userRating` (banda definida en ADR-005).
3. Selecciona un ejercicio del resultado filtrado.
4. Devuelve el ejercicio al usuario, sin incluir `correctAnswer`.

## Flujos Alternativos

- **2a. Sin resultados en la banda estrecha**: no hay ejercicios dentro de ±150 → se amplía la banda progresivamente (p. ej. ±300) antes de fallar.
- **2b. Sin ningún ejercicio disponible**: no hay ningún `Exercise` para el Tema/`AcademicLevel`, ni siquiera en banda ampliada → se informa al usuario de una espera breve y se puede disparar/encolar [UC-001 Generate Exercise (Batch)](UC-001-generate-exercise-batch.md). *(Propuesta de diseño, no bloqueante para el resto del documento — a confirmar al implementar.)*

## Postcondiciones

Usuario recibe un ejercicio acorde a su dificultad actual.

## Entidades involucradas

`Exercise`, `User` (`userRating`), `Session`.

## Referencias

- [ADR-005](../ADR/ADR-005-adaptive-difficulty-engine.md) — banda de selección ±150.
- [ADR-006](../ADR/ADR-006_math_topics.md) — filtrado por Tema.
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — este caso de uso es determinista, no invoca IA (a diferencia de UC-001).
