import type { ExerciseId, Hint, HintId } from '@mathmind/shared-domain'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { createPrismaClient } from '../persistence/prismaClient.js'
import { PrismaHintRepository } from './PrismaHintRepository.js'

describe('PrismaHintRepository (integration)', () => {
  const prisma = createPrismaClient(process.env.DATABASE_URL!)
  const repository = new PrismaHintRepository(prisma)
  const createdExerciseIds: ExerciseId[] = []

  afterEach(async () => {
    await prisma.hint.deleteMany({ where: { exerciseId: { in: createdExerciseIds } } })
    await prisma.exercise.deleteMany({ where: { id: { in: createdExerciseIds } } })
    createdExerciseIds.length = 0
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  async function anExerciseId(): Promise<ExerciseId> {
    const id = crypto.randomUUID() as ExerciseId
    createdExerciseIds.push(id)
    await prisma.exercise.create({
      data: {
        id,
        type: 'Resolution',
        academicLevel: 'Primaria',
        topic: 'arit.suma-resta',
        statement: '15 + 27',
        options: [],
        correctAnswer: '42',
        difficultyValue: 625,
        timeLimitMs: 15000,
        explanation: 'Suma directa.',
        generatedBy: 'Manual',
      },
    })
    return id
  }

  function aHint(exerciseId: ExerciseId, overrides: Partial<Hint> = {}): Hint {
    return {
      id: crypto.randomUUID() as HintId,
      exerciseId,
      order: 1,
      content: 'Suma primero las decenas.',
      ...overrides,
    }
  }

  it('save + findByExerciseIdAndOrder: round-trip', async () => {
    const exerciseId = await anExerciseId()
    const hint = aHint(exerciseId)

    await repository.save(hint)
    const found = await repository.findByExerciseIdAndOrder(exerciseId, 1)

    expect(found).toEqual(hint)
  })

  it('findByExerciseIdAndOrder: null si no existe ese order para el ejercicio', async () => {
    const exerciseId = await anExerciseId()
    const found = await repository.findByExerciseIdAndOrder(exerciseId, 1)
    expect(found).toBeNull()
  })

  it('save: dos pistas con order distinto para el mismo ejercicio conviven', async () => {
    const exerciseId = await anExerciseId()
    const first = aHint(exerciseId, { order: 1, content: 'Pista 1' })
    const second = aHint(exerciseId, { order: 2, content: 'Pista 2' })

    await repository.save(first)
    await repository.save(second)

    expect((await repository.findByExerciseIdAndOrder(exerciseId, 1))?.content).toBe('Pista 1')
    expect((await repository.findByExerciseIdAndOrder(exerciseId, 2))?.content).toBe('Pista 2')
  })

  it('save: upsert -- misma (exerciseId, order) actualiza el contenido en vez de duplicar', async () => {
    const exerciseId = await anExerciseId()
    const hint = aHint(exerciseId, { content: 'Version 1' })
    await repository.save(hint)
    await repository.save({ ...hint, content: 'Version 2' })

    const found = await repository.findByExerciseIdAndOrder(exerciseId, hint.order)
    expect(found?.content).toBe('Version 2')
    expect(found?.id).toBe(hint.id)
  })
})
