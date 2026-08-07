// Trazabilidad: UC-007 (docs/use-cases/UC-007-get-user-statistics.md) + mapa de rutas
// ARCHITECTURE.md ("API REST", GET /users/me/statistics). Compone GetUserStatisticsUseCase
// real. GetUserStatisticsResponseDto.score/rating son numeros planos (no Score/Difficulty) y
// byTopic mapea result.topics completo (no solo strengths/weaknesses).
//
// TDD Red: StatisticsController todavia no tiene implementacion (declare class, sin cuerpo).
// Se espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  InMemoryAnswerRepository,
  InMemoryExerciseRepository,
  InMemoryTemaRepository,
  InMemoryUserRepository,
} from '@mathmind/shared-testing'
import type { Exercise, ExerciseId, SessionId, Tema, User, UserId } from '@mathmind/shared-domain'
import { StatisticsController } from './StatisticsController.js'
import { GetUserStatisticsUseCase } from '../../application/use-cases/GetUserStatisticsUseCase.js'

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
    ratings: new Map([['Secundaria', { value: 1250 }]]),
    currentStreak: 0,
    score: { points: 120 },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('StatisticsController', () => {
  let controller: StatisticsController
  let users: InMemoryUserRepository

  beforeEach(async () => {
    users = new InMemoryUserRepository()
    const answers = new InMemoryAnswerRepository()
    const exercises = new InMemoryExerciseRepository()
    const temas = new InMemoryTemaRepository([aTema()])
    controller = new StatisticsController(new GetUserStatisticsUseCase(users, answers, exercises, temas))

    await users.save(aUser())
    await exercises.save(anExercise())
    answers.sessionOwners.set('session-1' as SessionId, 'user-1' as UserId)
  })

  it('mapea GetUserStatisticsOutput -> GetUserStatisticsResponseDto (score/rating como numeros)', async () => {
    const result = await controller.getStatistics('user-1')

    expect(result.score).toBe(120)
    expect(result.rating).toBe(1250)
    expect(result.academicLevel).toBe('Secundaria')
    expect(result.byTopic).toEqual([])
  })

  it('usa la semilla del nivel si el usuario todavia no tiene rating registrado', async () => {
    await users.save(aUser({ ratings: new Map() }))

    const result = await controller.getStatistics('user-1')

    expect(result.rating).toBe(1200)
  })
})
