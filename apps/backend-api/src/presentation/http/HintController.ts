import type { RequestHintRequestDto, RequestHintResponseDto } from '@mathmind/shared-types'

// Presentation layer -- UC-003 Generate Hint.
// Sin cuerpo todavia -- pendiente de Tests (ADR-003) y de los Casos de Uso.
export declare class HintController {
  requestHint(request: RequestHintRequestDto): Promise<RequestHintResponseDto>
}
