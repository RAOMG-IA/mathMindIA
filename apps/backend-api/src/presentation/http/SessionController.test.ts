// Trazabilidad: UC-005/UC-006 (docs/use-cases/UC-005-start-session.md, UC-006-end-session.md)
// + mapa de rutas ARCHITECTURE.md ("API REST", POST /sessions, POST /sessions/end). Compone
// las implementaciones reales de StartSessionUseCase/EndSessionUseCase/SelectNextExerciseUseCase.
//
// TDD Red: SessionController todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FixedClock,
  InMemoryAnswerRepository,
  InMemoryExerciseRepository,
  InMemorySessionRepository,
  InMemoryTemaRepository,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from '@mathmind/shared-testing'
import type { Exercise, ExerciseId, Tema, User, UserId } from '@mathmind/shared-domain'
import { SessionController } from './SessionController.js'
import { EndSessionUseCase } from '../../application/use-cases/EndSessionUseCase.js'
import { SelectNextExerciseUseCase } from '../../application/use-cases/SelectNextExerciseUseCase.js'
import { StartSessionUseCase } from '../../application/use-cases/StartSessionUseCase.js'

function aTema(overrides: Partial<Tema> = {}): Tema {
  return {
    code: 'aritmetica-mental',
    area: 'arit',
    label: 'Aritmetica mental',
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

describe('SessionController', () => {
  let controller: SessionController
  let users: InMemoryUserRepository
  const now = new Date('2026-08-07T09:00:00Z')

  beforeEach(async () => {
    const sessions = new InMemorySessionRepository()
    const exercises = new InMemoryExerciseRepository()
    users = new InMemoryUserRepository()
    const temas = new InMemoryTemaRepository([aTema()])
    const selectNextExercise = new SelectNextExerciseUseCase(exercises, users)
    const startSessionUseCase = new StartSessionUseCase(
      temas,
      sessions,
      users,
      selectNextExercise,
      new SequentialIdGenerator('session'),
      new FixedClock(now),
    )
    const endSessionUseCase = new EndSessionUseCase(
      sessions,
      new InMemoryAnswerRepository(),
      users,
      new FixedClock(now),
    )
    controller = new SessionController(startSessionUseCase, endSessionUseCase)

    await users.save(aUser())
    await exercises.save(anExercise())
  })

  it('startSession: crea la sesion y mapea StartSessionOutput -> StartSessionResponseDto', async () => {
    const result = await controller.startSession('user-1', {
      mode: 'Resolution',
      academicLevel: 'Secundaria',
      topic: 'aritmetica-mental',
    })

    expect(result.session).toEqual({
      id: 'session-1',
      mode: 'Resolution',
      academicLevel: 'Secundaria',
      startedAt: now.toISOString(),
    })
    expect(result.exercise).toEqual({
      id: 'exercise-1',
      type: 'Resolution',
      statement: '2 + 2',
      options: undefined,
      timeLimitMs: 10000,
    })
  })

  it('endSession: mapea EndSessionOutput -> EndSessionResponseDto (renombra campos)', async () => {
    await controller.startSession('user-1', {
      mode: 'Resolution',
      academicLevel: 'Secundaria',
      topic: 'aritmetica-mental',
    })

    const result = await controller.endSession('user-1', { sessionId: 'session-1' })

    expect(result).toEqual({
      totalAttempts: 0,
      correctAttempts: 0,
      avgResponseTimeMs: 0,
      ratingChange: 0,
    })
  })

  it('endSession: propaga el rechazo si la Session pertenece a otro usuario (IDOR)', async () => {
    await controller.startSession('user-1', {
      mode: 'Resolution',
      academicLevel: 'Secundaria',
      topic: 'aritmetica-mental',
    })

    await expect(controller.endSession('otro-usuario', { sessionId: 'session-1' })).rejects.toThrow()
  })
})
