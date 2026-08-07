import type { PrismaClient } from '@prisma/client'
import type { Session, SessionId, SessionRepository, UserId } from '@mathmind/shared-domain'

// Implementacion de SessionRepository sobre Prisma. Ver ADR-013 (tabla `sessions`).
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: SessionId): Promise<Session | null> {
    const row = await this.prisma.session.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async save(session: Session): Promise<void> {
    await this.prisma.session.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        userId: session.userId,
        mode: session.mode,
        academicLevel: session.academicLevel,
        topic: session.topic,
        ratingAtStart: session.ratingAtStart.value,
        startedAt: session.startedAt,
        endedAt: session.endedAt ?? null,
      },
      update: {
        endedAt: session.endedAt ?? null,
      },
    })
  }

  private toDomain(row: {
    id: string
    userId: string
    mode: Session['mode']
    academicLevel: Session['academicLevel']
    topic: string
    ratingAtStart: number
    startedAt: Date
    endedAt: Date | null
  }): Session {
    return {
      id: row.id as SessionId,
      userId: row.userId as UserId,
      mode: row.mode,
      academicLevel: row.academicLevel,
      topic: row.topic,
      ratingAtStart: { value: row.ratingAtStart },
      startedAt: row.startedAt,
      endedAt: row.endedAt ?? undefined,
    }
  }
}
