# Infrastructure / Persistence

Cliente de base de datos (PostgreSQL vía Prisma) y caché (Redis). Modelo de datos físico definido en [`database/schema.prisma`](../../../../../database/schema.prisma), ver [ADR-013](../../../../../docs/ADR/ADR-013_modelo_datos_fisico.md). Config de conexión en `apps/backend-api/prisma.config.ts` (Prisma 7 movió la `DATABASE_URL` fuera de `schema.prisma`).

Pendiente de implementar: cliente Prisma instanciado con driver adapter (`@prisma/adapter-pg` o equivalente — Prisma 7 lo requiere en vez de pasar la URL directamente al constructor de `PrismaClient`), y las migraciones reales (`npm run db:migrate`, requiere PostgreSQL vivo).
