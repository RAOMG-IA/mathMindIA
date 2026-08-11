import type { Exercise, ExerciseId } from '@mathmind/shared-domain'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { createPrismaClient } from '../persistence/prismaClient.js'
import { PrismaExerciseRepository } from './PrismaExerciseRepository.js'

describe('PrismaExerciseRepository (integration)', () => {
  const prisma = createPrismaClient(process.env.DATABASE_URL!)
  const repository = new PrismaExerciseRepository(prisma)
  const createdExerciseIds: ExerciseId[] = []
  // Topic unico por ejecucion -- evita colisionar con el Exercise seed real de main.ts
  // (mismo academicLevel/topic 'arit.suma-resta' que este test usaba antes) al filtrar
  // por findByDifficultyBand.
  const TEST_TOPIC = `test.topic.${crypto.randomUUID()}`

  function trackExercise(id: ExerciseId): ExerciseId {
    createdExerciseIds.push(id)
    return id
  }

  afterEach(async () => {
    await prisma.exercise.deleteMany({ where: { id: { in: createdExerciseIds } } })
    createdExerciseIds.length = 0
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  function anExercise(overrides: Partial<Exercise> = {}): Exercise {
    const id = trackExercise(crypto.randomUUID() as ExerciseId)
    return {
      id,
      type: 'Resolution',
      academicLevel: 'Primaria',
      topic: TEST_TOPIC,
      statement: '15 + 27',
      correctAnswer: '42',
      difficulty: { value: 625 },
      timer: { limitMs: 15000 },
      explanation: 'Suma directa.',
      generatedBy: 'manual',
      ...overrides,
    }
  }

  it('save + findById: round-trip de un Exercise Resolution (sin options)', async () => {
    const exercise = anExercise()
    await repository.save(exercise)

    const found = await repository.findById(exercise.id)
    expect(found).toEqual(exercise)
  })

  it('save + findById: round-trip de un Exercise Test (con options y generatedBy ai-batch)', async () => {
    const exercise = anExercise({
      type: 'Test',
      options: ['42', '40', '45'],
      generatedBy: 'ai-batch',
    })
    await repository.save(exercise)

    const found = await repository.findById(exercise.id)
    expect(found).toEqual(exercise)
  })

  it('findById: devuelve null si no existe', async () => {
    const found = await repository.findById('does-not-exist' as ExerciseId)
    expect(found).toBeNull()
  })

  it('findByDifficultyBand: filtra por academicLevel + topic (igualdad) y difficulty (rango)', async () => {
    const inBand = anExercise({ difficulty: { value: 600 } })
    const outOfBand = anExercise({ difficulty: { value: 900 } })
    const otherTopic = anExercise({ topic: 'arit.fracciones', difficulty: { value: 600 } })
    const otherLevel = anExercise({ academicLevel: 'Secundaria', difficulty: { value: 600 } })
    await Promise.all([inBand, outOfBand, otherTopic, otherLevel].map((e) => repository.save(e)))

    const result = await repository.findByDifficultyBand({
      academicLevel: 'Primaria',
      topic: TEST_TOPIC,
      type: 'Resolution',
      band: { min: 500, max: 750 },
    })

    expect(result.map((e) => e.id)).toEqual([inBand.id])
  })

  it('save: upsert -- una segunda llamada actualiza en vez de duplicar', async () => {
    const exercise = anExercise()
    await repository.save(exercise)
    await repository.save({ ...exercise, difficulty: { value: 700 } })

    const found = await repository.findById(exercise.id)
    expect(found?.difficulty).toEqual({ value: 700 })

    const all = await repository.findByDifficultyBand({
      academicLevel: exercise.academicLevel,
      topic: exercise.topic,
      type: exercise.type,
      band: { min: 0, max: 3000 },
    })
    expect(all.filter((e) => e.id === exercise.id)).toHaveLength(1)
  })
})
