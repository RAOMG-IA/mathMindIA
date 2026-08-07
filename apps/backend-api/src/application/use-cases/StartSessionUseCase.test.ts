// Trazabilidad: UC-005 (docs/use-cases/UC-005-start-session.md), US-003
// (docs/user-stories/US-003-iniciar-sesion-entrenamiento.md) + ADR-004 (forma de Session) y
// ADR-006 (docs/ADR/ADR-006_math_topics.md, catalogo de Temas). Compone la implementacion real
// de SelectNextExerciseUseCase (UC-008, ya implementado y testeado) en vez de un fake, mismo
// criterio que ValidateAnswerUseCase con UpdateDifficultyUseCase.
//
// TDD Red: StartSessionUseCase todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FixedClock,
  InMemoryExerciseRepository,
  InMemorySessionRepository,
  InMemoryTemaRepository,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from '@mathmind/shared-testing'
import type { Exercise, ExerciseId, SessionId, Tema, User, UserId } from '@mathmind/shared-domain'
import { SelectNextExerciseUseCase } from './SelectNextExerciseUseCase.js'
import { StartSessionUseCase } from './StartSessionUseCase.js'

function aTema(overrides: Partial<Tema> = {}): Tema {
  return {
    code: 'aritmetica-mental',
    area: 'arit',
    label: 'Aritmética mental',
    description: 'Suma y resta mental',
    academicLevels: [{ level: 'Secundaria', difficultyRange: { min: 800, max: 1600 } }],
    ...overrides,
  }
}

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

describe('StartSessionUseCase (UC-005)', () => {
  let sessions: InMemorySessionRepository
  let exercises: InMemoryExerciseRepository
  let users: InMemoryUserRepository
  let temas: InMemoryTemaRepository
  let useCase: StartSessionUseCase
  const now = new Date('2026-08-06T09:00:00Z')

  beforeEach(() => {
    sessions = new InMemorySessionRepository()
    exercises = new InMemoryExerciseRepository()
    users = new InMemoryUserRepository()
    temas = new InMemoryTemaRepository([aTema()])
    const selectNextExercise = new SelectNextExerciseUseCase(exercises, users)
    useCase = new StartSessionUseCase(
      temas,
      sessions,
      users,
      selectNextExercise,
      new SequentialIdGenerator('session'),
      new FixedClock(now),
    )
  })

  it('crea la Session con ratingAtStart y devuelve el primer ejercicio (UC-008)', async () => {
    await users.save(aUser({ ratings: new Map([['Secundaria', { value: 1200 }]]) }))
    await exercises.save(anExercise({ difficulty: { value: 1200 } }))

    const result = await useCase.execute({
      userId: 'user-1' as UserId,
      mode: 'Resolution',
      academicLevel: 'Secundaria',
      topic: 'aritmetica-mental',
    })

    expect(result.session.id).toBe('session-1')
    expect(result.session.userId).toBe('user-1')
    expect(result.session.topic).toBe('aritmetica-mental')
    expect(result.session.ratingAtStart).toEqual({ value: 1200 })
    expect(result.session.startedAt).toEqual(now)
    expect(result.session.endedAt).toBeUndefined()
    expect(result.exercise.id).toBe('exercise-1')

    const persisted = await sessions.findById('session-1' as SessionId)
    expect(persisted).not.toBeNull()
  })

  it('flujo 1a, lanza si el Tema no existe en el catalogo', async () => {
    await users.save(aUser())
    await exercises.save(anExercise())

    await expect(
      useCase.execute({ userId: 'user-1' as UserId, mode: 'Resolution', academicLevel: 'Secundaria', topic: 'tema-inexistente' }),
    ).rejects.toThrow()
  })

  it('flujo 1a, lanza si el Tema no aplica al AcademicLevel elegido', async () => {
    await users.save(aUser({ academicLevel: 'Primaria', ratings: new Map([['Primaria', { value: 700 }]]) }))
    await exercises.save(anExercise({ academicLevel: 'Primaria' }))

    await expect(
      useCase.execute({ userId: 'user-1' as UserId, mode: 'Resolution', academicLevel: 'Primaria', topic: 'aritmetica-mental' }),
    ).rejects.toThrow()
  })

  it('lanza si el usuario no existe', async () => {
    await exercises.save(anExercise())

    await expect(
      useCase.execute({ userId: 'no-existe' as UserId, mode: 'Resolution', academicLevel: 'Secundaria', topic: 'aritmetica-mental' }),
    ).rejects.toThrow()
  })

  it('propaga el error de SelectNextExerciseUseCase cuando no hay ejercicios disponibles', async () => {
    await users.save(aUser())
    // Sin exercises.save: ningun ejercicio disponible ni en banda ampliada.

    await expect(
      useCase.execute({ userId: 'user-1' as UserId, mode: 'Resolution', academicLevel: 'Secundaria', topic: 'aritmetica-mental' }),
    ).rejects.toThrow()
  })
})
