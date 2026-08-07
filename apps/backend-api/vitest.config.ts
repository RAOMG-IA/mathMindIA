import { configDefaults, defineConfig } from 'vitest/config'

// Excluye los tests de integracion (Prisma contra Postgres real) del run por defecto --
// turbo run test debe seguir siendo determinista y sin depender de una base de datos viva.
// Ver vitest.integration.config.ts (script npm run test:integration).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/*.integration.test.ts'],
  },
})
