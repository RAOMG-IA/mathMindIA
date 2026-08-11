import type {
  AnswerRepository,
  ExerciseId,
  HintUsageTracker,
  Session,
  SessionId,
  SessionRepository,
  TemaRepository,
  UserId,
} from '@mathmind/shared-domain'
import type { GenerateExerciseBatchUseCase } from '@mathmind/ai-engine'
import type { SubmitAnswerRequestDto, SubmitAnswerResponseDto } from '@mathmind/shared-types'
import type { SelectNextExerciseUseCase } from '../../application/use-cases/SelectNextExerciseUseCase.js'
import type { ValidateAnswerUseCase } from '../../application/use-cases/ValidateAnswerUseCase.js'

// UC-008 flujo 2b ("se informa al usuario de una espera breve y se puede disparar/encolar
// UC-001 Generate Exercise Batch"): cuantos ejercicios pedir al LLM cuando el pool esta
// realmente agotado (ni banda ampliada ni exclusion de ya respondidos dan candidatos). Mismo
// judgment call que EXERCISE_BATCH_COUNT en generateExerciseBatch.ts -- unos pocos alcanzan
// para reponer sin quemar cuota de golpe en un solo request HTTP.
const ON_DEMAND_BATCH_COUNT = 3

// Presentation layer -- UC-002 Validate Answer (compone UC-008 Select Next Exercise en la
// misma respuesta -- "a nivel de contrato HTTP", ver packages/shared-types/src/dtos/Answer.ts).
// userId recibido por separado (contexto de autenticacion) para la verificacion de
// autorizacion de ValidateAnswerUseCase (hueco IDOR corregido, ver STATUS.md #25).
// hintsUsed no viene en SubmitAnswerRequestDto (no se confia en el cliente) -- se lee de
// HintUsageTracker.get antes de invocar ValidateAnswerUseCase. academicLevel/topic/type para
// UC-008 se leen de la Session (SessionRepository), no del request -- Session.topic/mode (hueco
// detectado aqui, ver Session.ts) es lo que permite seguir sirviendo ejercicios del mismo tema
// y type (invariante "todo Answer referencia un Exercise cuyo type coincide con mode", nunca
// aplicada hasta ahora -- ver findByDifficultyBand, ADR-006 adenda 2026-08-11).
// Si UC-008 falla incluso tras excluir ejercicios ya servidos e intentar generar un lote nuevo
// (flujo 2b), nextExercise se omite en vez de fallar toda la respuesta -- es opcional en el DTO
// precisamente para cubrir ese caso.
export class AnswerController {
  constructor(
    private readonly validateAnswerUseCase: ValidateAnswerUseCase,
    private readonly selectNextExerciseUseCase: SelectNextExerciseUseCase,
    private readonly hintUsage: HintUsageTracker,
    private readonly sessions: SessionRepository,
    private readonly answers: AnswerRepository,
    private readonly temas: TemaRepository,
    private readonly generateExerciseBatchUseCase: GenerateExerciseBatchUseCase,
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

    const excludeExerciseIds = (await this.answers.findBySessionId(sessionId)).map((answer) => answer.exerciseId)

    const first = await this.trySelectNext(userId, session, excludeExerciseIds)
    if (first) {
      return first
    }

    // UC-008 flujo 2b: pool agotado incluso en banda ampliada -- intenta reponerlo con un lote
    // generado bajo demanda y reintenta la seleccion UNA vez. A diferencia del resto de UC-008
    // (deliberadamente determinista, ver ARCHITECTURE.md "Estrategia IA"), esta rama si invoca
    // IA -- unico caso, y solo cuando no queda otra alternativa (no en el camino feliz).
    const replenished = await this.tryReplenishPool(session)
    if (!replenished) {
      return undefined
    }

    return this.trySelectNext(userId, session, excludeExerciseIds)
  }

  private async trySelectNext(
    userId: string,
    session: Session,
    excludeExerciseIds: readonly ExerciseId[],
  ): Promise<SubmitAnswerResponseDto['nextExercise']> {
    try {
      const { exercise } = await this.selectNextExerciseUseCase.execute({
        userId: userId as UserId,
        academicLevel: session.academicLevel,
        topic: session.topic,
        type: session.mode,
        excludeExerciseIds,
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

  private async tryReplenishPool(session: Session): Promise<boolean> {
    const tema = await this.temas.findByCode(session.topic)
    if (!tema) {
      return false
    }

    try {
      await this.generateExerciseBatchUseCase.execute({
        tema,
        academicLevel: session.academicLevel,
        type: session.mode,
        count: ON_DEMAND_BATCH_COUNT,
      })
      return true
    } catch {
      return false
    }
  }
}
