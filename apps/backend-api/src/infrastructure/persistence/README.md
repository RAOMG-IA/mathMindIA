# Infrastructure / Persistence

Cliente de base de datos (PostgreSQL vía Prisma) y caché (Redis, sin implementar todavía — ningún Caso de Uso la usa). Modelo de datos físico definido en [`database/schema.prisma`](../../../../../database/schema.prisma), ver [ADR-013](../../../../../docs/ADR/ADR-013_modelo_datos_fisico.md). Config de conexión en `apps/backend-api/prisma.config.ts` (Prisma 7 movió la `DATABASE_URL` fuera de `schema.prisma`).

`prismaClient.ts`: factory `createPrismaClient(databaseUrl)` que instancia `PrismaClient` con el driver adapter `@prisma/adapter-pg` (`PrismaPg`) — Prisma 7 lo requiere en vez de pasar la URL directamente al constructor. Usada por `apps/backend-api/src/presentation/main.ts` para construir el cliente compartido que consumen los `Prisma*Repository` de [`../repositories`](../repositories/README.md).
