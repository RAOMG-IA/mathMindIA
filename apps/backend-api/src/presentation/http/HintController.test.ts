// Trazabilidad: UC-003 (docs/use-cases/UC-003-generate-hint.md) + mapa de rutas
// ARCHITECTURE.md ("API REST", POST /hints). Compone GenerateHintUseCase real con un
// HintGenerator fake local (mismo criterio que GenerateHintUseCase.test.ts).
//
// TDD Red: HintController todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  InMemoryExerciseRepository,
  InMemoryHintRepository,
  InMemoryHintUsageTracker,
  InMemorySessionRepository,
  SequentialIdGenerator,
} from '@mathmind/shared-testing'
import type { Exercise, ExerciseId, Session, SessionId, UserId } from '@mathmind/shared-domain'
import { HintController } from './HintController.js'
import { GenerateHintUseCase } from '../../application/use-cases/GenerateHintUseCase.js'
import type { HintGenerator } from '../../application/use-cases/GenerateHintUseCase.js'

class FakeHintGenerator implements HintGenerator {
  async generate(): Promise<{ content: string }> {
    return { content: 'Piensa en decenas' }
  }
}

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

describe('HintController', () => {
  let controller: HintController

  beforeEach(async () => {
    const sessions = new InMemorySessionRepository()
    const exercises = new InMemoryExerciseRepository()
    const hints = new InMemoryHintRepository()
    const hintUsage = new InMemoryHintUsageTracker()
    const generateHintUseCase = new GenerateHintUseCase(
      sessions,
      exercises,
      hints,
      hintUsage,
      new FakeHintGenerator(),
      new SequentialIdGenerator('hint'),
    )
    controller = new HintController(generateHintUseCase)

    await sessions.save(aSession())
    await exercises.save(anExercise())
  })

  it('mapea RequestHintRequestDto -> RequestHintResponseDto (hintsUsedSoFar == order)', async () => {
    const result = await controller.requestHint('user-1', {
      sessionId: 'session-1',
      exerciseId: 'exercise-1',
      elapsedMs: 10000,
    })

    expect(result).toEqual({ content: 'Piensa en decenas', order: 1, hintsUsedSoFar: 1 })
  })

  it('propaga el rechazo si la Session pertenece a otro usuario (IDOR)', async () => {
    await expect(
      controller.requestHint('otro-usuario', { sessionId: 'session-1', exerciseId: 'exercise-1', elapsedMs: 10000 }),
    ).rejects.toThrow()
  })
})
