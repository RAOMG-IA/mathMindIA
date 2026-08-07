// Trazabilidad: UC-002 (docs/use-cases/UC-002-validate-answer.md) + mapa de rutas
// ARCHITECTURE.md ("API REST", POST /answers). Compone ValidateAnswerUseCase +
// SelectNextExerciseUseCase reales ("a nivel de contrato HTTP", packages/shared-types/src/dtos/Answer.ts).
//
// TDD Red: AnswerController todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FixedClock,
  InMemoryAnswerRepository,
  InMemoryExerciseRepository,
  InMemoryHintUsageTracker,
  InMemorySessionRepository,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from '@mathmind/shared-testing'
import type { Exercise, ExerciseId, Session, SessionId, User, UserId } from '@mathmind/shared-domain'
import { AnswerController } from './AnswerController.js'
import { SelectNextExerciseUseCase } from '../../application/use-cases/SelectNextExerciseUseCase.js'
import { UpdateDifficultyUseCase } from '../../application/use-cases/UpdateDifficultyUseCase.js'
import { ValidateAnswerUseCase } from '../../application/use-cases/ValidateAnswerUseCase.js'

function aSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1' as SessionId,
    userId: 'user-1' as UserId,
    mode: 'Resolution',
    academicLevel: 'Secundaria',
    topic: 'aritmetica-mental',
    ratingAtStart: { value: 1200 },
    startedAt: new Date('2026-01-01T00:00:00Z'),
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

describe('AnswerController', () => {
  let controller: AnswerController
  let sessions: InMemorySessionRepository
  let exercises: InMemoryExerciseRepository
  let hintUsage: InMemoryHintUsageTracker
  let answers: InMemoryAnswerRepository

  beforeEach(async () => {
    sessions = new InMemorySessionRepository()
    exercises = new InMemoryExerciseRepository()
    answers = new InMemoryAnswerRepository()
    const users = new InMemoryUserRepository()
    hintUsage = new InMemoryHintUsageTracker()
    const updateDifficulty = new UpdateDifficultyUseCase(exercises)
    const validateAnswerUseCase = new ValidateAnswerUseCase(
      sessions,
      exercises,
      answers,
      users,
      updateDifficulty,
      new SequentialIdGenerator('answer'),
      new FixedClock(new Date('2026-08-07T12:00:00Z')),
    )
    const selectNextExerciseUseCase = new SelectNextExerciseUseCase(exercises, users)
    controller = new AnswerController(validateAnswerUseCase, selectNextExerciseUseCase, hintUsage, sessions)

    await sessions.save(aSession())
    await exercises.save(anExercise())
    await users.save(aUser())
  })

  it('respuesta correcta: compone isCorrect/explanation con el siguiente ejercicio (UC-008)', async () => {
    await exercises.save(anExercise({ id: 'exercise-2' as ExerciseId, difficulty: { value: 1200 } }))

    const result = await controller.submitAnswer('user-1', {
      sessionId: 'session-1',
      exerciseId: 'exercise-1',
      submittedValue: '4',
      responseTimeMs: 0,
    })

    expect(result.isCorrect).toBe(true)
    expect(result.explanation).toBe('2 + 2 = 4')
    expect(result.nextExercise).toBeDefined()
  })

  it('flujo 2b, sin ejercicios disponibles: omite nextExercise sin fallar toda la respuesta', async () => {
    // Sobrescribe exercise-1 con una dificultad muy alejada del rating del usuario (1200) --
    // fuera incluso de la banda ampliada (+-300) -- para que SelectNextExerciseUseCase no
    // encuentre ningun candidato (ni el propio ejercicio recien respondido).
    await exercises.save(anExercise({ difficulty: { value: 3000 } }))

    const result = await controller.submitAnswer('user-1', {
      sessionId: 'session-1',
      exerciseId: 'exercise-1',
      submittedValue: '5',
      responseTimeMs: 0,
    })

    expect(result.isCorrect).toBe(false)
    expect(result.nextExercise).toBeUndefined()
  })

  it('lee hintsUsed de HintUsageTracker (sin confiar en el cliente) y lo persiste en el Answer', async () => {
    await hintUsage.incrementAndGet('session-1' as SessionId, 'exercise-1' as ExerciseId)
    await hintUsage.incrementAndGet('session-1' as SessionId, 'exercise-1' as ExerciseId)

    await controller.submitAnswer('user-1', {
      sessionId: 'session-1',
      exerciseId: 'exercise-1',
      submittedValue: '4',
      responseTimeMs: 0,
    })

    const saved = await answers.findBySessionId('session-1' as SessionId)
    expect(saved[0]?.hintsUsed).toBe(2)
  })

  it('propaga el rechazo si la Session pertenece a otro usuario (IDOR)', async () => {
    await expect(
      controller.submitAnswer('otro-usuario', {
        sessionId: 'session-1',
        exerciseId: 'exercise-1',
        submittedValue: '4',
        responseTimeMs: 0,
      }),
    ).rejects.toThrow()
  })
})
