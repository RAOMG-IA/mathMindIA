import type { SessionId, UserId } from '@mathmind/shared-domain'
import type {
  EndSessionRequestDto,
  EndSessionResponseDto,
  StartSessionRequestDto,
  StartSessionResponseDto,
} from '@mathmind/shared-types'
import type { EndSessionUseCase } from '../../application/use-cases/EndSessionUseCase.js'
import type { StartSessionUseCase } from '../../application/use-cases/StartSessionUseCase.js'

// Presentation layer -- UC-005 Start Session, UC-006 End Session.
// userId recibido por separado (contexto de autenticacion, mismo patron que
// StatisticsController.getStatistics) -- los DTOs no lo llevan deliberadamente, para que el
// cliente no pueda suplantar a otro usuario via el body. endSession lo necesita ademas para la
// verificacion de autorizacion de EndSessionUseCase (hueco IDOR corregido, ver STATUS.md #25).
//
export class SessionController {
  constructor(
    private readonly startSessionUseCase: StartSessionUseCase,
    private readonly endSessionUseCase: EndSessionUseCase,
  ) {}

  async startSession(userId: string, request: StartSessionRequestDto): Promise<StartSessionResponseDto> {
    const result = await this.startSessionUseCase.execute({
      userId: userId as UserId,
      mode: request.mode,
      academicLevel: request.academicLevel,
      topic: request.topic,
    })

    return {
      session: {
        id: result.session.id,
        mode: result.session.mode,
        academicLevel: result.session.academicLevel,
        startedAt: result.session.startedAt.toISOString(),
      },
      exercise: {
        id: result.exercise.id,
        type: result.exercise.type,
        statement: result.exercise.statement,
        options: result.exercise.options,
        timeLimitMs: result.exercise.timeLimitMs,
      },
    }
  }

  async endSession(userId: string, request: EndSessionRequestDto): Promise<EndSessionResponseDto> {
    const result = await this.endSessionUseCase.execute({
      sessionId: request.sessionId as SessionId,
      userId: userId as UserId,
    })

    return {
      totalAttempts: result.totalAnswers,
      correctAttempts: result.correctAnswers,
      avgResponseTimeMs: result.avgResponseTimeMs,
      ratingChange: result.ratingChange,
    }
  }
}
