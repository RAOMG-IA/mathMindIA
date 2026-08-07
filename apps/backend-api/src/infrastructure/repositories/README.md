# Infrastructure / Repositories

Implementaciones concretas (Prisma) de los contratos de repositorio definidos en `packages/shared-domain/src/repositories` (`UserRepository`, `SessionRepository`, `AnswerRepository`, `HintRepository`, `ExerciseRepository`, `UserCredentialsRepository`) — ver [ADR-004](../../../../../docs/ADR/ADR-004_domain.md) ("ExercisePool no es una Entidad", es este contrato) y [ADR-013](../../../../../docs/ADR/ADR-013_modelo_datos_fisico.md) (modelo de datos físico que estas implementaciones consumen).

6 clases (`Prisma{User,Session,Answer,Hint,Exercise,UserCredentials}Repository`) — `UserCredentialsRepository` se añadió a este alcance cuando UC-009/UC-010 (Register/Login) dejaron de estar pendientes (ver ADR-013, adenda 2026-08-07). `TemaRepository` queda deliberadamente fuera — el catálogo de Temas (ADR-006) no está materializado como tabla, se sigue poblando por seed en memoria.

Implementación real (queries) contra `PrismaClient` (construido con el driver adapter de `../persistence/prismaClient.ts`), verificada con tests de integración reales contra Postgres — ver `*.integration.test.ts` junto a cada clase y `vitest.integration.config.ts` (`npm run test:integration`, fuera del `test` por defecto a propósito).
