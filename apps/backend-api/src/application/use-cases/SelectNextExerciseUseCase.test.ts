// Trazabilidad: UC-008 (docs/use-cases/UC-008-select-next-exercise.md), invocado por UC-005
// (docs/use-cases/UC-005-start-session.md) + ADR-005 (docs/ADR/ADR-005-adaptive-difficulty-engine.md,
// banda de seleccion +-150 / +-300 ampliada). "Selecciona un ejercicio del resultado filtrado"
// (UC-008 paso 3) no fija un algoritmo -- se implementa como "el mas cercano al userRating",
// judgment call documentado igual que MIN_ATTEMPTS_PER_TOPIC/TOP_N en GetUserStatisticsUseCase.
//
// TDD Red: SelectNextExerciseUseCase todavia no tiene implementacion (declare class, sin
// cuerpo). Se espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la
// implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryExerciseRepository, InMemoryUserRepository } from '@mathmind/shared-testing'
import type { Exercise, ExerciseId, User, UserId } from '@mathmind/shared-domain'
import { SelectNextExerciseUseCase } from './SelectNextExerciseUseCase.js'

function anExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'exercise-1' as ExerciseId,
    type: 'Resolution',
    academicLevel: 'Secundaria',
    topic: 'aritmetica-mental',
    statement: '2 + 2',
    correctAnswer: '4',
    difficulty: { value: 1200 },
    timer: { limitMs: 10000 },
    explanation: '2 + 2 = 4',
    generatedBy: 'manual',
    ...overrides,
  }
}

function aUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1' as UserId,
    email: 'user@example.com',
    academicLevel: 'Secundaria',
    ratings: new Map([['Secundaria', { value: 1200 }]]),
    currentStreak: 0,
    score: { points: 0 },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('SelectNextExerciseUseCase (UC-008)', () => {
  let exercises: InMemoryExerciseRepository
  let users: InMemoryUserRepository
  let useCase: SelectNextExerciseUseCase

  beforeEach(() => {
    exercises = new InMemoryExerciseRepository()
    users = new InMemoryUserRepository()
    useCase = new SelectNextExerciseUseCase(exercises, users)
  })

  it('selecciona, dentro de la banda +-150, el ejercicio mas cercano al userRating', async () => {
    await users.save(aUser({ ratings: new Map([['Secundaria', { value: 1200 }]]) }))
    await exercises.save(anExercise({ id: 'lejano' as ExerciseId, difficulty: { value: 1100 } }))
    await exercises.save(anExercise({ id: 'cercano' as ExerciseId, difficulty: { value: 1250 } }))

    const result = await useCase.execute({
      userId: 'user-1' as UserId,
      academicLevel: 'Secundaria',
      topic: 'aritmetica-mental',
    })

    expect(result.exercise.id).toBe('cercano')
  })

  it('flujo 2a, amplia la banda a +-300 cuando no hay resultados en +-150', async () => {
    await users.save(aUser({ ratings: new Map([['Secundaria', { value: 1200 }]]) }))
    await exercises.save(anExercise({ id: 'banda-ampliada' as ExerciseId, difficulty: { value: 1450 } }))

    const result = await useCase.execute({
      userId: 'user-1' as UserId,
      academicLevel: 'Secundaria',
      topic: 'aritmetica-mental',
    })

    expect(result.exercise.id).toBe('banda-ampliada')
  })

  it('flujo 2b, lanza si no hay ningun ejercicio disponible ni en banda ampliada', async () => {
    await users.save(aUser({ ratings: new Map([['Secundaria', { value: 1200 }]]) }))
    await exercises.save(anExercise({ id: 'fuera-de-banda' as ExerciseId, difficulty: { value: 1700 } }))

    await expect(
      useCase.execute({ userId: 'user-1' as UserId, academicLevel: 'Secundaria', topic: 'aritmetica-mental' }),
    ).rejects.toThrow()
  })

  it('usa el rating inicial por defecto si el usuario no tiene rating registrado para ese nivel', async () => {
    await users.save(aUser({ ratings: new Map() }))
    await exercises.save(anExercise({ id: 'en-rating-inicial' as ExerciseId, difficulty: { value: 1200 } }))

    const result = await useCase.execute({
      userId: 'user-1' as UserId,
      academicLevel: 'Secundaria',
      topic: 'aritmetica-mental',
    })

    expect(result.exercise.id).toBe('en-rating-inicial')
  })

  it('lanza si el usuario no existe', async () => {
    await exercises.save(anExercise())

    await expect(
      useCase.execute({ userId: 'no-existe' as UserId, academicLevel: 'Secundaria', topic: 'aritmetica-mental' }),
    ).rejects.toThrow()
  })

  it('la respuesta no incluye correctAnswer, difficulty ni explanation', async () => {
    await users.save(aUser())
    await exercises.save(anExercise())

    const result = await useCase.execute({
      userId: 'user-1' as UserId,
      academicLevel: 'Secundaria',
      topic: 'aritmetica-mental',
    })

    expect(result.exercise).not.toHaveProperty('correctAnswer')
    expect(result.exercise).not.toHaveProperty('difficulty')
    expect(result.exercise).not.toHaveProperty('explanation')
    expect(result.exercise.timeLimitMs).toBe(10000)
  })
})
