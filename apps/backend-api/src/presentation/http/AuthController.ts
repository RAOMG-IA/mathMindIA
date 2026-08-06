import type {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from '@mathmind/shared-types'

// Presentation layer -- traduce DTOs (packages/shared-types) a llamadas de Casos
// de Uso (US-001 Registro, US-002 Login). No conoce Express directamente: el
// adaptador HTTP (routes) mapea Request/Response a estos DTOs.
// Sin cuerpo todavia -- pendiente de Tests (ADR-003) y de los propios Casos de
// Uso en application/use-cases, todavia sin implementar.
export declare class AuthController {
  register(request: RegisterRequestDto): Promise<RegisterResponseDto>
  login(request: LoginRequestDto): Promise<LoginResponseDto>
}
