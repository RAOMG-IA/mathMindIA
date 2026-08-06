# Infrastructure / Repositories

Implementaciones concretas (Prisma) de los contratos de repositorio definidos en `packages/shared-domain/src/repositories` (`UserRepository`, `SessionRepository`, `AnswerRepository`, `HintRepository`, `ExerciseRepository`) — ver [ADR-004](../../../../../docs/ADR/ADR-004_domain.md) ("ExercisePool no es una Entidad", es este contrato) y [ADR-013](../../../../../docs/ADR/ADR-013_modelo_datos_fisico.md) (modelo de datos físico que estas implementaciones consumen).

Firmas de clase (`Prisma{User,Session,Answer,Hint,Exercise}Repository`) ya declaradas (`declare class`, sin cuerpo — no es código con lógica). La implementación real (queries) sigue esperando a Tests (TDD Enforcement Rule, [ADR-003](../../../../../docs/ADR-003_Trazabilidad.md)).

Ya existen dos Casos de Uso reales que consumen estos contratos vía sus dobles en memoria (`UpdateDifficultyUseCase`, `ValidateAnswerUseCase` en [`../../application/use-cases`](../../application/use-cases/README.md)) — desbloquea diseñar la implementación Prisma real cuando le toque su turno, pero todavía no la implementa.
