import type {
  AcademicLevel,
  ExerciseId,
  ExerciseRepository,
  ExerciseType,
  TemaCode,
  UserId,
  UserRepository,
} from '@mathmind/shared-domain'
import { INITIAL_RATING } from '@mathmind/shared-domain'

// Ver docs/use-cases/UC-008-select-next-exercise.md y docs/ADR/ADR-005-adaptive-difficulty-engine.md
// (banda de seleccion +-150, ampliada a +-300 en el flujo alternativo 2a). Determinista, sin IA
// (ver ARCHITECTURE.md, a diferencia de UC-001).
const SELECTION_BAND = 150
const WIDENED_BAND = 300

export interface SelectNextExerciseInput {
  readonly userId: UserId
  readonly academicLevel: AcademicLevel
  readonly topic: TemaCode
}

// Forma publica de un Exercise, sin correctAnswer/difficulty/explanation -- mismo criterio de
// exclusion que ExercisePublicDto (packages/shared-types/src/dtos/Exercise.ts), replicado aqui
// como tipo propio de Application (no se importa el DTO: Application no depende de Presentation).
export interface SelectableExercise {
  readonly id: ExerciseId
  readonly type: ExerciseType
  readonly statement: string
  readonly options?: readonly [string, string, string]
  readonly timeLimitMs: number
}

export interface SelectNextExerciseOutput {
  readonly exercise: SelectableExercise
}

export class SelectNextExerciseUseCase {
  constructor(
    private readonly exercises: ExerciseRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(input: SelectNextExerciseInput): Promise<SelectNextExerciseOutput> {
    const user = await this.users.findById(input.userId)
    if (!user) {
      throw new Error(`User not found: ${input.userId}`)
    }

    const userRating = user.ratings.get(input.academicLevel) ?? INITIAL_RATING

    const narrow = await this.exercises.findByDifficultyBand({
      academicLevel: input.academicLevel,
      topic: input.topic,
      band: { min: userRating.value - SELECTION_BAND, max: userRating.value + SELECTION_BAND },
    })

    const candidates =
      narrow.length > 0
        ? narrow
        : await this.exercises.findByDifficultyBand({
            academicLevel: input.academicLevel,
            topic: input.topic,
            band: { min: userRating.value - WIDENED_BAND, max: userRating.value + WIDENED_BAND },
          })

    if (candidates.length === 0) {
      throw new Error(
        `No exercises available for topic ${input.topic} at ${input.academicLevel} near rating ${userRating.value}`,
      )
    }

    const selected = candidates.reduce((closest, candidate) =>
      Math.abs(candidate.difficulty.value - userRating.value) <
      Math.abs(closest.difficulty.value - userRating.value)
        ? candidate
        : closest,
    )

    return {
      exercise: {
        id: selected.id,
        type: selected.type,
        statement: selected.statement,
        options: selected.options,
        timeLimitMs: selected.timer.limitMs,
      },
    }
  }
}
