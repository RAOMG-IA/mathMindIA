import type {
  EndSessionRequestDto,
  EndSessionResponseDto,
  StartSessionRequestDto,
  StartSessionResponseDto,
} from '@mathmind/shared-types'

// Presentation layer -- UC-005 Start Session, UC-006 End Session.
// Sin cuerpo todavia -- pendiente de Tests (ADR-003) y de los Casos de Uso.
export declare class SessionController {
  startSession(request: StartSessionRequestDto): Promise<StartSessionResponseDto>
  endSession(request: EndSessionRequestDto): Promise<EndSessionResponseDto>
}
