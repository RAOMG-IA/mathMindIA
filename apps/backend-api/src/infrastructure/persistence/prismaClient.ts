import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Prisma 7 requiere un driver adapter en vez de pasar DATABASE_URL directamente al
// constructor de PrismaClient (ver README de este directorio, ADR-013 adenda 2026-08-07).
// El cliente generado usa el compilador de queries WASM, sin motor nativo embebido.
export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl })
  return new PrismaClient({ adapter })
}
