# Database

`schema.prisma` — modelo de datos físico, ver [ADR-013](../docs/ADR/ADR-013_modelo_datos_fisico.md).

Schema sincronizado con un Postgres real (`prisma db push`) y los 6 `Prisma*Repository` implementados con TDD — ver [`apps/backend-api/src/infrastructure/repositories`](../apps/backend-api/src/infrastructure/repositories/README.md).

## Pendiente

- Migración formal real (`npx prisma migrate dev`) — bloqueada en este entorno por una discordancia de versión de collation en la base patrón `template1` de Postgres (típico tras una actualización de Windows), no por el schema; mientras tanto el schema se sincroniza con `prisma db push`.
- Seed data más allá del mínimo inline en `apps/backend-api/src/presentation/main.ts` (un `Tema` en memoria, un `Exercise` real).
