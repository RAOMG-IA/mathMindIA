import type { PrismaClient } from '@prisma/client'
import type { User, UserId, UserRepository } from '@mathmind/shared-domain'

// Implementacion de UserRepository (packages/shared-domain) sobre Prisma.
// Ver docs/ADR/ADR-013_modelo_datos_fisico.md (tabla `users` + `user_ratings`).
// Sin cuerpo todavia -- Developer Agent no implementa sin tests previos
// (TDD Enforcement Rule, docs/ADR-003_Trazabilidad.md).
export declare class PrismaUserRepository implements UserRepository {
  constructor(prisma: PrismaClient)
  findById(id: UserId): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
}
