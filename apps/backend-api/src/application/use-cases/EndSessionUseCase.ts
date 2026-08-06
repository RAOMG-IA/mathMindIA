import type {
  AnswerRepository,
  Clock,
  SessionId,
  SessionRepository,
  UserRepository,
} from '@mathmind/shared-domain'
import { INITIAL_RATING } from '@mathmind/shared-domain'

// Ver docs/use-cases/UC-006-end-session.md y docs/ADR/ADR-004_domain.md.
// La variacion de rating se calcula contra Session.ratingAtStart (snapshot tomado por
// StartSessionUseCase, UC-005, todavia sin implementar) -- ningun otro sitio del dominio
// persiste los deltas individuales de cada intento (ver UpdateDifficultyUseCase).
export interface EndSessionInput {
  readonly sessionId: SessionId
}

export interface EndSessionOutput {
  readonly correctAnswers: number
  readonly totalAnswers: number
  readonly avgResponseTimeMs: number
  readonly ratingChange: number
}

export class EndSessionUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly answers: AnswerRepository,
    private readonly users: UserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: EndSessionInput): Promise<EndSessionOutput> {
    const session = await this.sessions.findById(input.sessionId)
    if (!session || session.endedAt) {
      throw new Error(`No active session: ${input.sessionId}`)
    }

    const sessionAnswers = await this.answers.findBySessionId(input.sessionId)
    const totalAnswers = sessionAnswers.length
    const correctAnswers = sessionAnswers.filter((answer) => answer.isCorrect).length
    const avgResponseTimeMs =
      totalAnswers === 0
        ? 0
        : sessionAnswers.reduce((sum, answer) => sum + answer.responseTimeMs, 0) / totalAnswers

    const user = await this.users.findById(session.userId)
    const currentRating = user?.ratings.get(session.academicLevel) ?? INITIAL_RATING
    const ratingChange = currentRating.value - session.ratingAtStart.value

    await this.sessions.save({ ...session, endedAt: this.clock.now() })

    return { correctAnswers, totalAnswers, avgResponseTimeMs, ratingChange }
  }
}
