// Trazabilidad: UC-006 (docs/use-cases/UC-006-end-session.md), US-006
// (docs/user-stories/US-006-finalizar-sesion.md) + ADR-004 (docs/ADR/ADR-004_domain.md,
// forma de Session/Answer). La variacion de rating usa Session.ratingAtStart (snapshot
// añadido a la entidad en esta misma iteracion, ver Session.ts) comparado contra el rating
// actual del User para el academicLevel de la sesion.
//
// TDD Red: EndSessionUseCase todavia no tiene implementacion (declare class, sin cuerpo).
// Se espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FixedClock,
  InMemoryAnswerRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from '@mathmind/shared-testing'
import type { Answer, AnswerId, ExerciseId, Session, SessionId, User, UserId } from '@mathmind/shared-domain'
import { EndSessionUseCase } from './EndSessionUseCase.js'

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
    ratings: new Map([['Secundaria', { value: 1200 }]]),
    currentStreak: 0,
    score: { points: 0 },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('EndSessionUseCase (UC-006)', () => {
  let sessions: InMemorySessionRepository
  let answers: InMemoryAnswerRepository
  let users: InMemoryUserRepository
  let useCase: EndSessionUseCase
  const now = new Date('2026-08-06T13:00:00Z')

  beforeEach(() => {
    sessions = new InMemorySessionRepository()
    answers = new InMemoryAnswerRepository()
    users = new InMemoryUserRepository()
    useCase = new EndSessionUseCase(sessions, answers, users, new FixedClock(now))
  })

  it('calcula el resumen (aciertos, intentos, tiempo medio, variacion de rating) y fija endedAt', async () => {
    await sessions.save(aSession({ ratingAtStart: { value: 1200 } }))
    await users.save(aUser({ ratings: new Map([['Secundaria', { value: 1230 }]]) }))
    await answers.save(anAnswer({ id: 'a1' as AnswerId, isCorrect: true, responseTimeMs: 1000 }))
    await answers.save(anAnswer({ id: 'a2' as AnswerId, isCorrect: true, responseTimeMs: 2000 }))
    await answers.save(anAnswer({ id: 'a3' as AnswerId, isCorrect: false, responseTimeMs: 3000 }))

    const result = await useCase.execute({ sessionId: 'session-1' as SessionId })

    expect(result.correctAnswers).toBe(2)
    expect(result.totalAnswers).toBe(3)
    expect(result.avgResponseTimeMs).toBe(2000)
    expect(result.ratingChange).toBe(30)

    const ended = await sessions.findById('session-1' as SessionId)
    expect(ended?.endedAt).toEqual(now)
  })

  it('flujo alternativo, sesion sin ejercicios respondidos: resumen en cero sin error', async () => {
    await sessions.save(aSession({ ratingAtStart: { value: 1200 } }))
    await users.save(aUser({ ratings: new Map([['Secundaria', { value: 1200 }]]) }))

    const result = await useCase.execute({ sessionId: 'session-1' as SessionId })

    expect(result.correctAnswers).toBe(0)
    expect(result.totalAnswers).toBe(0)
    expect(result.avgResponseTimeMs).toBe(0)
    expect(result.ratingChange).toBe(0)
  })

  it('lanza si la Session no existe', async () => {
    await expect(useCase.execute({ sessionId: 'no-existe' as SessionId })).rejects.toThrow()
  })

  it('lanza si la Session ya esta finalizada', async () => {
    await sessions.save(aSession({ endedAt: new Date('2026-01-01T01:00:00Z') }))

    await expect(useCase.execute({ sessionId: 'session-1' as SessionId })).rejects.toThrow()
  })
})
