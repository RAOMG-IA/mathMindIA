import type { SubmitAnswerRequestDto, SubmitAnswerResponseDto } from '@mathmind/shared-types'

// Presentation layer -- UC-002 Validate Answer (compone UC-008 Select Next
// Exercise en la misma respuesta, ver packages/shared-types/src/dtos/Answer.ts).
// Sin cuerpo todavia -- pendiente de Tests (ADR-003) y de los Casos de Uso.
export declare class AnswerController {
  submitAnswer(request: SubmitAnswerRequestDto): Promise<SubmitAnswerResponseDto>
}
