# Infrastructure / Repositories

Implementaciones concretas (Prisma) de los contratos de repositorio definidos en `packages/shared-domain/src/repositories` (`UserRepository`, `SessionRepository`, `AnswerRepository`, `HintRepository`, `ExerciseRepository`) — ver [ADR-004](../../../../../docs/ADR/ADR-004_domain.md) ("ExercisePool no es una Entidad", es este contrato) y [ADR-013](../../../../../docs/ADR/ADR-013_modelo_datos_fisico.md) (modelo de datos físico que estas implementaciones consumen).

Pendiente de implementar — es código con lógica real (queries), sigue esperando a Tests (TDD Enforcement Rule, [ADR-003](../../../../../docs/ADR-003_Trazabilidad.md)).
