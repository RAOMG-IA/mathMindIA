import type { Answer, AnswerId, ExerciseId, SessionId, UserId } from '@mathmind/shared-domain'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { createPrismaClient } from '../persistence/prismaClient.js'
import { PrismaAnswerRepository } from './PrismaAnswerRepository.js'

describe('PrismaAnswerRepository (integration)', () => {
  const prisma = createPrismaClient(process.env.DATABASE_URL!)
  const repository = new PrismaAnswerRepository(prisma)
  const createdUserIds: UserId[] = []
  const createdExerciseIds: ExerciseId[] = []
  const createdSessionIds: SessionId[] = []

  afterEach(async () => {
    await prisma.answer.deleteMany({ where: { sessionId: { in: createdSessionIds } } })
    await prisma.session.deleteMany({ where: { id: { in: createdSessionIds } } })
    await prisma.exercise.deleteMany({ where: { id: { in: createdExerciseIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    createdSessionIds.length = 0
    createdExerciseIds.length = 0
    createdUserIds.length = 0
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  async function fixtures(): Promise<{ userId: UserId; sessionId: SessionId; exerciseId: ExerciseId }> {
    const userId = crypto.randomUUID() as UserId
    createdUserIds.push(userId)
    await prisma.user.create({
      data: { id: userId, email: `user-${userId}@example.com`, academicLevel: 'Secundaria' },
    })

    const exerciseId = crypto.randomUUID() as ExerciseId
    createdExerciseIds.push(exerciseId)
    await prisma.exercise.create({
      data: {
        id: exerciseId,
        type: 'Resolution',
        academicLevel: 'Secundaria',
        topic: 'arit.suma-resta',
        statement: '15 + 27',
        options: [],
        correctAnswer: '42',
        difficultyValue: 1200,
        timeLimitMs: 15000,
        explanation: 'Suma directa.',
        generatedBy: 'Manual',
      },
    })

    const sessionId = crypto.randomUUID() as SessionId
    createdSessionIds.push(sessionId)
    await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        mode: 'Resolution',
        academicLevel: 'Secundaria',
        topic: 'arit.suma-resta',
        ratingAtStart: 1200,
        startedAt: new Date('2026-01-01T10:00:00.000Z'),
      },
    })

    return { userId, sessionId, exerciseId }
  }

  function anAnswer(sessionId: SessionId, exerciseId: ExerciseId, overrides: Partial<Answer> = {}): Answer {
    return {
      id: crypto.randomUUID() as AnswerId,
      sessionId,
      exerciseId,
      submittedValue: '42',
      isCorrect: true,
      responseTimeMs: 4000,
      hintsUsed: 0,
      createdAt: new Date('2026-01-01T10:05:00.000Z'),
      ...overrides,
    }
  }

  it('save + findBySessionId: round-trip (el dominio no expone userId, se resuelve via Session)', async () => {
    const { sessionId, exerciseId } = await fixtures()
    const answer = anAnswer(sessionId, exerciseId)

    await repository.save(answer)
    const found = await repository.findBySessionId(sessionId)

    expect(found).toEqual([answer])
  })

  it('findByUserId: usa la columna user_id desnormalizada (sin JOIN a Session)', async () => {
    const { userId, sessionId, exerciseId } = await fixtures()
    const answer = anAnswer(sessionId, exerciseId)
    await repository.save(answer)

    const found = await repository.findByUserId(userId)
    expect(found).toEqual([answer])
  })

  it('findBySessionId/findByUserId: array vacio si no hay respuestas', async () => {
    const { userId, sessionId } = await fixtures()
    expect(await repository.findBySessionId(sessionId)).toEqual([])
    expect(await repository.findByUserId(userId)).toEqual([])
  })
})
