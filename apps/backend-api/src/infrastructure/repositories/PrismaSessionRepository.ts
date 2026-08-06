import type { PrismaClient } from '@prisma/client'
import type { Session, SessionId, SessionRepository } from '@mathmind/shared-domain'

// Implementacion de SessionRepository sobre Prisma. Ver ADR-013 (tabla `sessions`).
// Sin cuerpo todavia -- pendiente de Tests (ADR-003).
export declare class PrismaSessionRepository implements SessionRepository {
  constructor(prisma: PrismaClient)
  findById(id: SessionId): Promise<Session | null>
  save(session: Session): Promise<void>
}
