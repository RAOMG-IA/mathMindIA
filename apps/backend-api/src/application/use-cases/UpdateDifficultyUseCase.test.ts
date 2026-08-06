// Trazabilidad: UC-004 (docs/use-cases/UC-004-update-difficulty.md), invocado por UC-002
// (docs/use-cases/UC-002-validate-answer.md) + ADR-005 (docs/ADR/ADR-005-adaptive-difficulty-engine.md),
// fuente de los valores esperados (mismo caso ya validado a mano en AdaptiveDifficultyEngine.test.ts:
// "ratings iguales + acierto instantaneo + streak=0" -> nextUserRating=1216, nextExerciseRating=1196).
//
// TDD Red: UpdateDifficultyUseCase todavia no tiene implementacion (declare class, sin cuerpo).
// Se espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryExerciseRepository } from '@mathmind/shared-testing'
import type { AttemptResult, Difficulty, Exercise, ExerciseId } from '@mathmind/shared-domain'
import { UpdateDifficultyUseCase } from './UpdateDifficultyUseCase.js'

function difficulty(value: number): Difficulty {
  return { value }
}

function attempt(overrides: Partial<AttemptResult>): AttemptResult {
  return { correct: true, responseTimeMs: 0, timeLimitMs: 10000, ...overrides }
}

function anExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'exercise-1' as ExerciseId,
    type: 'Resolution',
    academicLevel: 'Secundaria',
    topic: 'aritmetica-mental',
    statement: '2 + 2',
    correctAnswer: '4',
    difficulty: difficulty(1200),
    timer: { limitMs: 10000 },
    explanation: '2 + 2 = 4',
    generatedBy: 'manual',
    ...overrides,
  }
}

describe('UpdateDifficultyUseCase (UC-004)', () => {
  let exercises: InMemoryExerciseRepository
  let useCase: UpdateDifficultyUseCase

  beforeEach(() => {
    exercises = new InMemoryExerciseRepository()
    useCase = new UpdateDifficultyUseCase(exercises)
  })

  it('calcula nextUserRating y persiste nextExerciseRating en el Exercise', async () => {
    await exercises.save(anExercise({ id: 'exercise-1' as ExerciseId, difficulty: difficulty(1200) }))

    const result = await useCase.execute({
      userRating: difficulty(1200),
      exerciseId: 'exercise-1' as ExerciseId,
      currentStreak: 0,
      attempt: attempt({ correct: true, responseTimeMs: 0, timeLimitMs: 10000 }),
    })

    expect(result.nextUserRating.value).toBe(1216)

    const persisted = await exercises.findById('exercise-1' as ExerciseId)
    expect(persisted?.difficulty.value).toBe(1196)
  })

  it('lanza si el Exercise no existe', async () => {
    await expect(
      useCase.execute({
        userRating: difficulty(1200),
        exerciseId: 'no-existe' as ExerciseId,
        currentStreak: 0,
        attempt: attempt({}),
      }),
    ).rejects.toThrow()
  })
})
