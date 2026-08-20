import type {
  GuestLoginResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from '@mathmind/shared-types'
import { fetchClient } from '../fetchClient'

// Funciones puras (sin React/TanStack Query) que mapean 1:1 a las rutas de openapi.yaml --
// separadas de los hooks (./ hooks/useAuth.ts) para poder testearlas sin necesitar
// QueryClientProvider/renderHook (ADR-015: un hook por ruta, esto es la mitad testeable).
export function registerRequest(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
  return fetchClient<RegisterResponseDto>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

export function loginRequest(dto: LoginRequestDto): Promise<LoginResponseDto> {
  return fetchClient<LoginResponseDto>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

// US-009: sin body -- el servidor genera email/password/academicLevel, ver
// GuestLoginUseCase (backend-api).
export function guestLoginRequest(): Promise<GuestLoginResponseDto> {
  return fetchClient<GuestLoginResponseDto>('/auth/guest', { method: 'POST' })
}
