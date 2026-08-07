import type { PrismaClient } from '@prisma/client'
import type { Answer, AnswerRepository, ExerciseId, SessionId, UserId } from '@mathmind/shared-domain'

// Implementacion de AnswerRepository sobre Prisma. Ver ADR-013 (tabla `answers`,
// incluye `user_id` desnormalizado para findByUserId sin JOIN -- ver "Desnormalizacion
// deliberada" en el ADR).
// Judgment call: Answer (dominio) no lleva userId -- se resuelve con una lectura extra de
// Session antes de escribir, en vez de cambiar el contrato del puerto (ver STATUS.md,
// entrada de este mismo cambio).
export class PrismaAnswerRepository implements AnswerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(answer: Answer): Promise<void> {
    const session = await this.prisma.session.findUniqueOrThrow({
      where: { id: answer.sessionId },
      select: { userId: true },
    })

    await this.prisma.answer.upsert({
      where: { id: answer.id },
      create: {
        id: answer.id,
        sessionId: answer.sessionId,
        exerciseId: answer.exerciseId,
        userId: session.userId,
        submittedValue: answer.submittedValue,
        isCorrect: answer.isCorrect,
        responseTimeMs: answer.responseTimeMs,
        hintsUsed: answer.hintsUsed,
        createdAt: answer.createdAt,
      },
      update: {
        submittedValue: answer.submittedValue,
        isCorrect: answer.isCorrect,
        responseTimeMs: answer.responseTimeMs,
        hintsUsed: answer.hintsUsed,
      },
    })
  }

  async findBySessionId(sessionId: SessionId): Promise<readonly Answer[]> {
    const rows = await this.prisma.answer.findMany({ where: { sessionId } })
    return rows.map((row) => this.toDomain(row))
  }

  async findByUserId(userId: UserId): Promise<readonly Answer[]> {
    const rows = await this.prisma.answer.findMany({ where: { userId } })
    return rows.map((row) => this.toDomain(row))
  }

  private toDomain(row: {
    id: string
    sessionId: string
    exerciseId: string
    submittedValue: string
    isCorrect: boolean
    responseTimeMs: number
    hintsUsed: number
    createdAt: Date
  }): Answer {
    return {
      id: row.id as Answer['id'],
      sessionId: row.sessionId as SessionId,
      exerciseId: row.exerciseId as ExerciseId,
      submittedValue: row.submittedValue,
      isCorrect: row.isCorrect,
      responseTimeMs: row.responseTimeMs,
      hintsUsed: row.hintsUsed,
      createdAt: row.createdAt,
    }
  }
}
