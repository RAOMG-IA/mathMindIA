// Trazabilidad: UC-007 (docs/use-cases/UC-007-get-user-statistics.md), US-007
// (docs/user-stories/US-007-ver-estadisticas.md) + ADR-006 (docs/ADR/ADR-006_math_topics.md,
// agregacion por Tema). AnswerRepository.findByUserId ya resuelve el join Answer->Session
// como responsabilidad de infraestructura (ver su contrato en shared-domain) -- este Caso de
// Uso no depende de SessionRepository.
//
// TDD Red: GetUserStatisticsUseCase todavia no tiene implementacion (declare class, sin
// cuerpo). Se espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la
// implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  InMemoryAnswerRepository,
  InMemoryExerciseRepository,
  InMemoryUserRepository,
} from '@mathmind/shared-testing'
import type { Answer, AnswerId, Exercise, ExerciseId, SessionId, User, UserId } from '@mathmind/shared-domain'
import { GetUserStatisticsUseCase } from './GetUserStatisticsUseCase.js'

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

function anAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'answer-1' as AnswerId,
    sessionId: 'session-1' as SessionId,
    exerciseId: 'exercise-1' as ExerciseId,
    submittedValue: '4',
    isCorrect: true,
    responseTimeMs: 1000,
    hintsUsed: 0,
    createdAt: new Date('2026-08-06T12:00:00Z'),
    ...overrides,
  }
}

function aUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1' as UserId,
    email: 'user@example.com',
    academicLevel: 'Secundaria',
    ratings: new Map([['Secundaria', { value: 1250 }]]),
    currentStreak: 0,
    score: { points: 120 },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('GetUserStatisticsUseCase (UC-007)', () => {
  let users: InMemoryUserRepository
  let answers: InMemoryAnswerRepository
  let exercises: InMemoryExerciseRepository
  let useCase: GetUserStatisticsUseCase

  beforeEach(() => {
    users = new InMemoryUserRepository()
    answers = new InMemoryAnswerRepository()
    exercises = new InMemoryExerciseRepository()
    useCase = new GetUserStatisticsUseCase(users, answers, exercises)
    answers.sessionOwners.set('session-1' as SessionId, 'user-1' as UserId)
  })

  it('agrega por tema, calcula precision/tiempo medio y filtra fortalezas/debilidades por umbral de intentos', async () => {
    await users.save(aUser())

    await exercises.save(anExercise({ id: 'aritmetica-1' as ExerciseId, topic: 'aritmetica-mental' }))
    await exercises.save(anExercise({ id: 'fracciones-1' as ExerciseId, topic: 'fracciones' }))
    await exercises.save(anExercise({ id: 'porcentajes-1' as ExerciseId, topic: 'porcentajes' }))

    // Tema "aritmetica-mental": 3 intentos, 2 aciertos -> accuracy 0.6667, avg 2000ms
    await answers.save(anAnswer({ id: 'a1' as AnswerId, exerciseId: 'aritmetica-1' as ExerciseId, isCorrect: true, responseTimeMs: 1000 }))
    await answers.save(anAnswer({ id: 'a2' as AnswerId, exerciseId: 'aritmetica-1' as ExerciseId, isCorrect: true, responseTimeMs: 2000 }))
    await answers.save(anAnswer({ id: 'a3' as AnswerId, exerciseId: 'aritmetica-1' as ExerciseId, isCorrect: false, responseTimeMs: 3000 }))

    // Tema "fracciones": 4 intentos, 4 aciertos -> accuracy 1.0, avg 500ms
    await answers.save(anAnswer({ id: 'a4' as AnswerId, exerciseId: 'fracciones-1' as ExerciseId, isCorrect: true, responseTimeMs: 500 }))
    await answers.save(anAnswer({ id: 'a5' as AnswerId, exerciseId: 'fracciones-1' as ExerciseId, isCorrect: true, responseTimeMs: 500 }))
    await answers.save(anAnswer({ id: 'a6' as AnswerId, exerciseId: 'fracciones-1' as ExerciseId, isCorrect: true, responseTimeMs: 500 }))
    await answers.save(anAnswer({ id: 'a7' as AnswerId, exerciseId: 'fracciones-1' as ExerciseId, isCorrect: true, responseTimeMs: 500 }))

    // Tema "porcentajes": 1 solo intento -> por debajo de MIN_ATTEMPTS_PER_TOPIC, no cuenta
    // como fortaleza/debilidad aunque su accuracy sea perfecta.
    await answers.save(anAnswer({ id: 'a8' as AnswerId, exerciseId: 'porcentajes-1' as ExerciseId, isCorrect: true, responseTimeMs: 100 }))

    const result = await useCase.execute({ userId: 'user-1' as UserId })

    expect(result.score).toEqual({ points: 120 })
    expect(result.ratings.get('Secundaria')).toEqual({ value: 1250 })

    expect(result.topics).toHaveLength(3)
    const aritmetica = result.topics.find((t) => t.topic === 'aritmetica-mental')
    expect(aritmetica?.attempts).toBe(3)
    expect(aritmetica?.correctAttempts).toBe(2)
    expect(aritmetica?.accuracy).toBeCloseTo(0.6667, 3)
    expect(aritmetica?.avgResponseTimeMs).toBe(2000)

    expect(result.strengths.map((t) => t.topic)).toEqual(['fracciones', 'aritmetica-mental'])
    expect(result.weaknesses.map((t) => t.topic)).toEqual(['aritmetica-mental', 'fracciones'])
    expect(result.strengths.some((t) => t.topic === 'porcentajes')).toBe(false)
    expect(result.weaknesses.some((t) => t.topic === 'porcentajes')).toBe(false)
  })

  it('flujo 2a, usuario sin historial: resumen vacio sin error', async () => {
    await users.save(aUser())

    const result = await useCase.execute({ userId: 'user-1' as UserId })

    expect(result.topics).toEqual([])
    expect(result.strengths).toEqual([])
    expect(result.weaknesses).toEqual([])
    expect(result.score).toEqual({ points: 120 })
  })

  it('lanza si el User no existe', async () => {
    await expect(useCase.execute({ userId: 'no-existe' as UserId })).rejects.toThrow()
  })
})
