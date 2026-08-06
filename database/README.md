# Database

`schema.prisma` — modelo de datos físico, ver [ADR-013](../docs/ADR/ADR-013_modelo_datos_fisico.md).

## Pendiente

- Migraciones reales (`npx prisma migrate dev`) — requieren una instancia de PostgreSQL viva (ver `apps/backend-api/.env.example` para `DATABASE_URL`); no se han ejecutado.
- Seed data.
- Implementaciones concretas de los repositorios (`packages/shared-domain` define los contratos; `PrismaUserRepository` etc. viven en `apps/backend-api/src/infrastructure/repositories`, pendientes de Tests).
