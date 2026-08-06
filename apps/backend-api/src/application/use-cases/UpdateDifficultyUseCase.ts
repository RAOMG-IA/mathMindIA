import { computeNextDifficulty } from '@mathmind/shared-domain'
import type {
  AttemptResult,
  Difficulty,
  ExerciseId,
  ExerciseRepository,
} from '@mathmind/shared-domain'

// Ver docs/use-cases/UC-004-update-difficulty.md y docs/ADR/ADR-005-adaptive-difficulty-engine.md.
// Wrapper de orquestacion sobre AdaptiveDifficultyEngine.computeNextDifficulty (ya implementado
// y testeado): obtiene el Exercise, calcula, persiste el lado del ejercicio (upsert) y devuelve
// nextUserRating a quien lo invoque (ValidateAnswerUseCase, que es quien persiste el User).
export interface UpdateDifficultyInput {
  readonly userRating: Difficulty
  readonly exerciseId: ExerciseId
  readonly currentStreak: number
  readonly attempt: AttemptResult
}

export interface UpdateDifficultyOutput {
  readonly nextUserRating: Difficulty
}

export class UpdateDifficultyUseCase {
  constructor(private readonly exercises: ExerciseRepository) {}

  async execute(input: UpdateDifficultyInput): Promise<UpdateDifficultyOutput> {
    const exercise = await this.exercises.findById(input.exerciseId)
    if (!exercise) {
      throw new Error(`Exercise not found: ${input.exerciseId}`)
    }

    const { nextUserRating, nextExerciseRating } = computeNextDifficulty(
      input.userRating,
      exercise.difficulty,
      input.currentStreak,
      input.attempt,
    )

    await this.exercises.save({ ...exercise, difficulty: nextExerciseRating })

    return { nextUserRating }
  }
}
