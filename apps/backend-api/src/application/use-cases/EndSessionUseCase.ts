import type {
  AnswerRepository,
  Clock,
  SessionId,
  SessionRepository,
  UserId,
  UserRepository,
} from '@mathmind/shared-domain'
import { SEED_RATING_BY_LEVEL } from '@mathmind/shared-domain'

// Ver docs/use-cases/UC-006-end-session.md y docs/ADR/ADR-004_domain.md.
// La variacion de rating se calcula contra Session.ratingAtStart (snapshot tomado por
// StartSessionUseCase, UC-005, todavia sin implementar) -- ningun otro sitio del dominio
// persiste los deltas individuales de cada intento (ver UpdateDifficultyUseCase).
// userId: hueco de autorizacion detectado al mapear rutas (ARCHITECTURE.md, "API REST") --
// sin esto, cualquier usuario autenticado podia finalizar la Session de otro (IDOR).
export interface EndSessionInput {
  readonly sessionId: SessionId
  readonly userId: UserId
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
    if (session.userId !== input.userId) {
      throw new Error(`Session ${input.sessionId} does not belong to user ${input.userId}`)
    }

    const sessionAnswers = await this.answers.findBySessionId(input.sessionId)
    const totalAnswers = sessionAnswers.length
    const correctAnswers = sessionAnswers.filter((answer) => answer.isCorrect).length
    const avgResponseTimeMs =
      totalAnswers === 0
        ? 0
        : sessionAnswers.reduce((sum, answer) => sum + answer.responseTimeMs, 0) / totalAnswers

    const user = await this.users.findById(session.userId)
    const currentRating =
      user?.ratings.get(session.academicLevel) ?? SEED_RATING_BY_LEVEL[session.academicLevel]
    const ratingChange = currentRating.value - session.ratingAtStart.value

    await this.sessions.save({ ...session, endedAt: this.clock.now() })

    return { correctAnswers, totalAnswers, avgResponseTimeMs, ratingChange }
  }
}
