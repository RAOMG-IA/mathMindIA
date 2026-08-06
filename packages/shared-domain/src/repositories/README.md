# Repository Contracts

Interfaces (`UserRepository`, `SessionRepository`, `AnswerRepository`, `HintRepository`, `ExerciseRepository`). `ExerciseRepository.findByDifficultyBand(...)` sustituye a `ExercisePool` como entidad — ver [ADR-004](../../../../docs/ADR/ADR-004_domain.md), "Desviación: ExercisePool no es una Entidad".

Implementaciones concretas viven en `apps/backend-api/src/infrastructure/repositories`. Pendiente de implementar.
