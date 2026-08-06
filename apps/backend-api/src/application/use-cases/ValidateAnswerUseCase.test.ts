// Trazabilidad: UC-002 (docs/use-cases/UC-002-validate-answer.md), US-004
// (docs/user-stories/US-004-resolver-ejercicio.md) + ADR-004 (docs/ADR/ADR-004_domain.md,
// forma de Answer/Session/User) y ADR-005 (formula de rating, via UpdateDifficultyUseCase real
// -- mismo caso base que UpdateDifficultyUseCase.test.ts: userRating=1200, streak=0, acierto
// instantaneo -> nextUserRating=1216).
//
// TDD Red: ValidateAnswerUseCase todavia no tiene implementacion (declare class, sin cuerpo).
// Se espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FixedClock,
  InMemoryAnswerRepository,
  InMemoryExerciseRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from '@mathmind/shared-testing'
import type { Exercise, ExerciseId, Session, SessionId, User, UserId } from '@mathmind/shared-domain'
import { UpdateDifficultyUseCase } from './UpdateDifficultyUseCase.js'
import { ValidateAnswerUseCase } from './ValidateAnswerUseCase.js'

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

function aSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1' as SessionId,
    userId: 'user-1' as UserId,
    mode: 'Resolution',
    academicLevel: 'Secundaria',
    ratingAtStart: { value: 1200 },
    startedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

function aUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1' as UserId,
    email: 'user@example.com',
    academicLevel: 'Secundaria',
    ratings: new Map(),
    currentStreak: 0,
    score: { points: 0 },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('ValidateAnswerUseCase (UC-002)', () => {
  let sessions: InMemorySessionRepository
  let exercises: InMemoryExerciseRepository
  let answers: InMemoryAnswerRepository
  let users: InMemoryUserRepository
  let useCase: ValidateAnswerUseCase
  const now = new Date('2026-08-06T12:00:00Z')

  beforeEach(() => {
    sessions = new InMemorySessionRepository()
    exercises = new InMemoryExerciseRepository()
    answers = new InMemoryAnswerRepository()
    users = new InMemoryUserRepository()
    const updateDifficulty = new UpdateDifficultyUseCase(exercises)
    useCase = new ValidateAnswerUseCase(
      sessions,
      exercises,
      answers,
      users,
      updateDifficulty,
      new SequentialIdGenerator('answer'),
      new FixedClock(now),
    )
  })

  it('respuesta correcta: isCorrect=true, Answer persistido, streak++, rating actualizado', async () => {
    await sessions.save(aSession())
    await exercises.save(anExercise())
    await users.save(aUser({ currentStreak: 0 }))

    const result = await useCase.execute({
      sessionId: 'session-1' as SessionId,
      exerciseId: 'exercise-1' as ExerciseId,
      submittedValue: '4',
      responseTimeMs: 0,
      hintsUsed: 0,
    })

    expect(result.isCorrect).toBe(true)
    expect(result.explanation).toBe('2 + 2 = 4')

    const saved = await answers.findBySessionId('session-1' as SessionId)
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      id: 'answer-1',
      isCorrect: true,
      responseTimeMs: 0,
      hintsUsed: 0,
      createdAt: now,
    })

    const updatedUser = await users.findById('user-1' as UserId)
    expect(updatedUser?.currentStreak).toBe(1)
    expect(updatedUser?.ratings.get('Secundaria')?.value).toBe(1216)
  })

  it('respuesta incorrecta: isCorrect=false y la racha se resetea a 0', async () => {
    await sessions.save(aSession())
    await exercises.save(anExercise())
    await users.save(aUser({ currentStreak: 3 }))

    const result = await useCase.execute({
      sessionId: 'session-1' as SessionId,
      exerciseId: 'exercise-1' as ExerciseId,
      submittedValue: '5',
      responseTimeMs: 1000,
      hintsUsed: 0,
    })

    expect(result.isCorrect).toBe(false)

    const updatedUser = await users.findById('user-1' as UserId)
    expect(updatedUser?.currentStreak).toBe(0)
  })

  it('flujo 1a, tiempo agotado: se trata como intento incorrecto aunque el valor coincida', async () => {
    await sessions.save(aSession())
    await exercises.save(anExercise())
    await users.save(aUser({ currentStreak: 2 }))

    const result = await useCase.execute({
      sessionId: 'session-1' as SessionId,
      exerciseId: 'exercise-1' as ExerciseId,
      submittedValue: '4',
      responseTimeMs: 10000,
      hintsUsed: 0,
    })

    expect(result.isCorrect).toBe(false)

    const updatedUser = await users.findById('user-1' as UserId)
    expect(updatedUser?.currentStreak).toBe(0)
  })

  it('lanza si la Session no existe (precondicion)', async () => {
    await exercises.save(anExercise())
    await users.save(aUser())

    await expect(
      useCase.execute({
        sessionId: 'no-existe' as SessionId,
        exerciseId: 'exercise-1' as ExerciseId,
        submittedValue: '4',
        responseTimeMs: 0,
        hintsUsed: 0,
      }),
    ).rejects.toThrow()
  })

  it('lanza si la Session ya esta finalizada (endedAt definido)', async () => {
    await sessions.save(aSession({ endedAt: new Date('2026-01-01T01:00:00Z') }))
    await exercises.save(anExercise())
    await users.save(aUser())

    await expect(
      useCase.execute({
        sessionId: 'session-1' as SessionId,
        exerciseId: 'exercise-1' as ExerciseId,
        submittedValue: '4',
        responseTimeMs: 0,
        hintsUsed: 0,
      }),
    ).rejects.toThrow()
  })

  it('lanza si el Exercise no existe (precondicion)', async () => {
    await sessions.save(aSession())
    await users.save(aUser())

    await expect(
      useCase.execute({
        sessionId: 'session-1' as SessionId,
        exerciseId: 'no-existe' as ExerciseId,
        submittedValue: '4',
        responseTimeMs: 0,
        hintsUsed: 0,
      }),
    ).rejects.toThrow()
  })
})
