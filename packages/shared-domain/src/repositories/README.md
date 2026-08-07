# Repository Contracts

Interfaces (`UserRepository`, `SessionRepository`, `AnswerRepository`, `HintRepository`, `ExerciseRepository`, `TemaRepository`, `UserCredentialsRepository`). `ExerciseRepository.findByDifficultyBand(...)` sustituye a `ExercisePool` como entidad — ver [ADR-004](../../../../docs/ADR/ADR-004_domain.md), "Desviación: ExercisePool no es una Entidad". `UserCredentialsRepository` es deliberadamente independiente de `UserRepository` (UC-009/UC-010) — las credenciales no viven en el agregado `User`.

Implementaciones concretas viven en `apps/backend-api/src/infrastructure/repositories`. Pendiente de implementar.
