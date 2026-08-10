import { defineConfig } from 'vitest/config'

// Tests de integracion reales de los Prisma*Repository contra el Postgres de desarrollo.
// Fuera de turbo.json/npm test a proposito: requieren una base de datos viva,
// npm run test:integration los ejecuta aparte.
// La base de desarrollo es el contenedor Docker de ADR-016 (docker compose up),
// o un Postgres local alternativo -- el codigo solo lee DATABASE_URL.
export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    setupFiles: ['dotenv/config'],
  },
})
