import type { ExerciseId, HintUsageTracker, SessionId, SessionRepository, UserId } from '@mathmind/shared-domain'
import type { SubmitAnswerRequestDto, SubmitAnswerResponseDto } from '@mathmind/shared-types'
import type { SelectNextExerciseUseCase } from '../../application/use-cases/SelectNextExerciseUseCase.js'
import type { ValidateAnswerUseCase } from '../../application/use-cases/ValidateAnswerUseCase.js'

// Presentation layer -- UC-002 Validate Answer (compone UC-008 Select Next Exercise en la
// misma respuesta -- "a nivel de contrato HTTP", ver packages/shared-types/src/dtos/Answer.ts).
// userId recibido por separado (contexto de autenticacion) para la verificacion de
// autorizacion de ValidateAnswerUseCase (hueco IDOR corregido, ver STATUS.md #25).
// hintsUsed no viene en SubmitAnswerRequestDto (no se confia en el cliente) -- se lee de
// HintUsageTracker.get antes de invocar ValidateAnswerUseCase. academicLevel/topic para UC-008
// se leen de la Session (SessionRepository), no del request -- Session.topic (hueco detectado
// aqui, ver Session.ts) es lo que permite seguir sirviendo ejercicios del mismo tema.
// Si UC-008 falla (pool agotado, flujo 2b), nextExercise se omite en vez de fallar toda la
// respuesta -- es opcional en el DTO precisamente para cubrir ese caso.
//
export class AnswerController {
  constructor(
    private readonly validateAnswerUseCase: ValidateAnswerUseCase,
    private readonly selectNextExerciseUseCase: SelectNextExerciseUseCase,
    private readonly hintUsage: HintUsageTracker,
    private readonly sessions: SessionRepository,
  ) {}

  async submitAnswer(userId: string, request: SubmitAnswerRequestDto): Promise<SubmitAnswerResponseDto> {
    const sessionId = request.sessionId as SessionId
    const exerciseId = request.exerciseId as ExerciseId
    const hintsUsed = await this.hintUsage.get(sessionId, exerciseId)

    const result = await this.validateAnswerUseCase.execute({
      sessionId,
      userId: userId as UserId,
      exerciseId,
      submittedValue: request.submittedValue,
      responseTimeMs: request.responseTimeMs,
      hintsUsed,
    })

    const nextExercise = await this.tryComposeNextExercise(userId, sessionId)

    return { isCorrect: result.isCorrect, explanation: result.explanation, nextExercise }
  }

  private async tryComposeNextExercise(
    userId: string,
    sessionId: SessionId,
  ): Promise<SubmitAnswerResponseDto['nextExercise']> {
    const session = await this.sessions.findById(sessionId)
    if (!session) {
      return undefined
    }

    try {
      const { exercise } = await this.selectNextExerciseUseCase.execute({
        userId: userId as UserId,
        academicLevel: session.academicLevel,
        topic: session.topic,
      })
      return {
        id: exercise.id,
        type: exercise.type,
        statement: exercise.statement,
        options: exercise.options,
        timeLimitMs: exercise.timeLimitMs,
      }
    } catch {
      return undefined
    }
  }
}
