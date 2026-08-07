import { defineConfig } from 'vitest/config'

// Tests de integracion reales de los Prisma*Repository contra el Postgres de desarrollo
// (DATABASE_URL de .env, sin Docker -- entorno mono-servidor). Fuera de turbo.json/npm test
// a proposito: requieren una base de datos viva, npm run test:integration los ejecuta aparte.
export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    setupFiles: ['dotenv/config'],
  },
})
