import type { ExerciseId, SessionId, UserId } from '@mathmind/shared-domain'
import type { RequestHintRequestDto, RequestHintResponseDto } from '@mathmind/shared-types'
import type { GenerateHintUseCase } from '../../application/use-cases/GenerateHintUseCase.js'

// Presentation layer -- UC-003 Generate Hint.
// userId recibido por separado (contexto de autenticacion) para la verificacion de
// autorizacion de GenerateHintUseCase (hueco IDOR corregido, ver STATUS.md #25).
// RequestHintResponseDto.hintsUsedSoFar == GenerateHintOutput.order (ver comentario en
// GenerateHintUseCase.ts).
//
export class HintController {
  constructor(private readonly generateHintUseCase: GenerateHintUseCase) {}

  async requestHint(userId: string, request: RequestHintRequestDto): Promise<RequestHintResponseDto> {
    const result = await this.generateHintUseCase.execute({
      sessionId: request.sessionId as SessionId,
      userId: userId as UserId,
      exerciseId: request.exerciseId as ExerciseId,
      elapsedMs: request.elapsedMs,
    })

    return { content: result.content, order: result.order, hintsUsedSoFar: result.order }
  }
}
