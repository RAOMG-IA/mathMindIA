import { INITIAL_RATING } from '@mathmind/shared-domain'
import type {
  Answer,
  AnswerId,
  AnswerRepository,
  Clock,
  ExerciseId,
  ExerciseRepository,
  IdGenerator,
  SessionId,
  SessionRepository,
  UserRepository,
} from '@mathmind/shared-domain'
import type { UpdateDifficultyUseCase } from './UpdateDifficultyUseCase.js'

// Ver docs/use-cases/UC-002-validate-answer.md y docs/ADR/ADR-004_domain.md.
// El timeout (flujo alternativo 1a) se deriva de responseTimeMs >= Exercise.timer.limitMs,
// sin campo de input dedicado.
export interface ValidateAnswerInput {
  readonly sessionId: SessionId
  readonly exerciseId: ExerciseId
  readonly submittedValue: string
  readonly responseTimeMs: number
  readonly hintsUsed: number
}

export interface ValidateAnswerOutput {
  readonly isCorrect: boolean
  readonly explanation: string
}

export class ValidateAnswerUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly exercises: ExerciseRepository,
    private readonly answers: AnswerRepository,
    private readonly users: UserRepository,
    private readonly updateDifficulty: UpdateDifficultyUseCase,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: ValidateAnswerInput): Promise<ValidateAnswerOutput> {
    const session = await this.sessions.findById(input.sessionId)
    if (!session || session.endedAt) {
      throw new Error(`No active session: ${input.sessionId}`)
    }

    const exercise = await this.exercises.findById(input.exerciseId)
    if (!exercise) {
      throw new Error(`Exercise not found: ${input.exerciseId}`)
    }

    const user = await this.users.findById(session.userId)
    if (!user) {
      throw new Error(`User not found: ${session.userId}`)
    }

    const timedOut = input.responseTimeMs >= exercise.timer.limitMs
    const isCorrect = !timedOut && input.submittedValue === exercise.correctAnswer

    const answer: Answer = {
      id: this.ids.generate() as AnswerId,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      submittedValue: input.submittedValue,
      isCorrect,
      responseTimeMs: input.responseTimeMs,
      hintsUsed: input.hintsUsed,
      createdAt: this.clock.now(),
    }
    await this.answers.save(answer)

    const nextStreak = isCorrect ? user.currentStreak + 1 : 0
    const userRating = user.ratings.get(exercise.academicLevel) ?? INITIAL_RATING

    const { nextUserRating } = await this.updateDifficulty.execute({
      userRating,
      exerciseId: input.exerciseId,
      currentStreak: user.currentStreak,
      attempt: {
        correct: isCorrect,
        responseTimeMs: input.responseTimeMs,
        timeLimitMs: exercise.timer.limitMs,
      },
    })

    const nextRatings = new Map(user.ratings)
    nextRatings.set(exercise.academicLevel, nextUserRating)
    await this.users.save({ ...user, currentStreak: nextStreak, ratings: nextRatings })

    return { isCorrect, explanation: exercise.explanation }
  }
}
