import type { PrismaClient } from '@prisma/client'
import type { UserCredentials, UserCredentialsRepository, UserId } from '@mathmind/shared-domain'

// Implementacion de UserCredentialsRepository (packages/shared-domain) sobre Prisma.
// Ver docs/ADR/ADR-013_modelo_datos_fisico.md (adenda 2026-08-07, tabla `user_credentials`,
// separada del agregado User a proposito -- ADR-004).
export class PrismaUserCredentialsRepository implements UserCredentialsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: UserId): Promise<UserCredentials | null> {
    const row = await this.prisma.userCredentials.findUnique({ where: { userId } })
    return row ? { userId: row.userId as UserId, passwordHash: row.passwordHash } : null
  }

  async save(credentials: UserCredentials): Promise<void> {
    await this.prisma.userCredentials.upsert({
      where: { userId: credentials.userId },
      create: { userId: credentials.userId, passwordHash: credentials.passwordHash },
      update: { passwordHash: credentials.passwordHash },
    })
  }
}
