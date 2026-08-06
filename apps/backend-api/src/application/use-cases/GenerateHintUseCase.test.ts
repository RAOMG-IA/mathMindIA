// Trazabilidad: UC-003 (docs/use-cases/UC-003-generate-hint.md), US-005
// (docs/user-stories/US-005-solicitar-pista.md) + ADR-004 (docs/ADR/ADR-004_domain.md, forma
// de Hint). HintGenerator es un fake local (no InMemory* en shared-testing): es un puerto de
// Application, no un contrato de dominio/infra reutilizado por otros Casos de Uso todavia.
//
// TDD Red: GenerateHintUseCase todavia no tiene implementacion (declare class, sin cuerpo).
// Se espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  InMemoryExerciseRepository,
  InMemoryHintRepository,
  InMemoryHintUsageTracker,
  InMemorySessionRepository,
  SequentialIdGenerator,
} from '@mathmind/shared-testing'
import type { Exercise, ExerciseId, Hint, HintId, Session, SessionId, UserId } from '@mathmind/shared-domain'
import { GenerateHintUseCase } from './GenerateHintUseCase.js'
import type { HintGenerator } from './GenerateHintUseCase.js'

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

class FakeHintGenerator implements HintGenerator {
  readonly calls: Array<{ exercise: Exercise; order: number; previousHints: readonly string[] }> = []

  async generate(input: {
    exercise: Exercise
    order: number
    previousHints: readonly string[]
  }): Promise<{ content: string }> {
    this.calls.push(input)
    return { content: `pista generada #${input.order}` }
  }
}

describe('GenerateHintUseCase (UC-003)', () => {
  let sessions: InMemorySessionRepository
  let exercises: InMemoryExerciseRepository
  let hints: InMemoryHintRepository
  let hintUsage: InMemoryHintUsageTracker
  let hintGenerator: FakeHintGenerator
  let useCase: GenerateHintUseCase

  beforeEach(async () => {
    sessions = new InMemorySessionRepository()
    exercises = new InMemoryExerciseRepository()
    hints = new InMemoryHintRepository()
    hintUsage = new InMemoryHintUsageTracker()
    hintGenerator = new FakeHintGenerator()
    useCase = new GenerateHintUseCase(
      sessions,
      exercises,
      hints,
      hintUsage,
      hintGenerator,
      new SequentialIdGenerator('hint'),
    )

    await sessions.save(aSession())
    await exercises.save(anExercise())
  })

  it('genera y persiste una pista nueva cuando no existe para ese order', async () => {
    const result = await useCase.execute({
      sessionId: 'session-1' as SessionId,
      exerciseId: 'exercise-1' as ExerciseId,
      elapsedMs: 10000,
    })

    expect(result.order).toBe(1)
    expect(result.content).toBe('pista generada #1')
    expect(hintGenerator.calls).toHaveLength(1)
    expect(hintGenerator.calls[0]?.previousHints).toEqual([])

    const persisted = await hints.findByExerciseIdAndOrder('exercise-1' as ExerciseId, 1)
    expect(persisted?.content).toBe('pista generada #1')
  })

  it('incluye las pistas previas ya generadas al pedir una pista progresiva', async () => {
    await useCase.execute({
      sessionId: 'session-1' as SessionId,
      exerciseId: 'exercise-1' as ExerciseId,
      elapsedMs: 10000,
    })

    await useCase.execute({
      sessionId: 'session-1' as SessionId,
      exerciseId: 'exercise-1' as ExerciseId,
      elapsedMs: 10000,
    })

    expect(hintGenerator.calls).toHaveLength(2)
    expect(hintGenerator.calls[1]?.order).toBe(2)
    expect(hintGenerator.calls[1]?.previousHints).toEqual(['pista generada #1'])
  })

  it('reutiliza una pista ya existente para ese order sin invocar a HintGenerator', async () => {
    const existing: Hint = {
      id: 'hint-existente' as HintId,
      exerciseId: 'exercise-1' as ExerciseId,
      order: 1,
      content: 'pista ya generada antes',
    }
    await hints.save(existing)

    const result = await useCase.execute({
      sessionId: 'session-1' as SessionId,
      exerciseId: 'exercise-1' as ExerciseId,
      elapsedMs: 10000,
    })

    expect(result.content).toBe('pista ya generada antes')
    expect(hintGenerator.calls).toHaveLength(0)
  })

  it('incrementa order en pistas sucesivas dentro del mismo intento', async () => {
    const first = await useCase.execute({
      sessionId: 'session-1' as SessionId,
      exerciseId: 'exercise-1' as ExerciseId,
      elapsedMs: 10000,
    })
    const second = await useCase.execute({
      sessionId: 'session-1' as SessionId,
      exerciseId: 'exercise-1' as ExerciseId,
      elapsedMs: 10000,
    })

    expect(first.order).toBe(1)
    expect(second.order).toBe(2)
  })

  it('flujo 1a, modo Test: rechaza la solicitud', async () => {
    await exercises.save(anExercise({ id: 'exercise-test' as ExerciseId, type: 'Test' }))

    await expect(
      useCase.execute({
        sessionId: 'session-1' as SessionId,
        exerciseId: 'exercise-test' as ExerciseId,
        elapsedMs: 10000,
      }),
    ).rejects.toThrow()
  })

  it('rechaza si el tiempo limite todavia no ha expirado', async () => {
    await expect(
      useCase.execute({
        sessionId: 'session-1' as SessionId,
        exerciseId: 'exercise-1' as ExerciseId,
        elapsedMs: 5000,
      }),
    ).rejects.toThrow()
  })

  it('lanza si la Session no existe o ya esta finalizada', async () => {
    await expect(
      useCase.execute({
        sessionId: 'no-existe' as SessionId,
        exerciseId: 'exercise-1' as ExerciseId,
        elapsedMs: 10000,
      }),
    ).rejects.toThrow()
  })
})
