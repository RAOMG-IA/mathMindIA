import type { ExerciseType } from '@mathmind/shared-domain'

// Forma publica de un Exercise, mostrada ANTES de responder (UC-005, UC-008).
// Deliberadamente NO incluye correctAnswer ni explanation (serian visibles en la
// respuesta de red antes de que el usuario conteste) ni difficulty (rating interno,
// ADR-005 -- no es informacion de producto). explanation se devuelve solo tras
// responder, en SubmitAnswerResponseDto.
export interface ExercisePublicDto {
  readonly id: string
  readonly type: ExerciseType
  readonly statement: string
  readonly options?: readonly [string, string, string]
  readonly timeLimitMs: number
}
