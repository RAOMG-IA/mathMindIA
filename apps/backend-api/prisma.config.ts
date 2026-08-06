import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prisma 7 movio aqui la connection URL (antes vivia en schema.prisma).
// Ver docs/ADR/ADR-013_modelo_datos_fisico.md.
export default defineConfig({
  schema: '../../database/schema.prisma',
  migrations: {
    path: '../../database/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
