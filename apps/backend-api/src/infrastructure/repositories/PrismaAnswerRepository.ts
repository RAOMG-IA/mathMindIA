import type { PrismaClient } from '@prisma/client'
import type { Answer, AnswerRepository, SessionId, UserId } from '@mathmind/shared-domain'

// Implementacion de AnswerRepository sobre Prisma. Ver ADR-013 (tabla `answers`,
// incluye `user_id` desnormalizado para findByUserId sin JOIN -- ver "Desnormalizacion
// deliberada" en el ADR).
// Sin cuerpo todavia -- pendiente de Tests (ADR-003).
export declare class PrismaAnswerRepository implements AnswerRepository {
  constructor(prisma: PrismaClient)
  save(answer: Answer): Promise<void>
  findBySessionId(sessionId: SessionId): Promise<readonly Answer[]>
  findByUserId(userId: UserId): Promise<readonly Answer[]>
}
