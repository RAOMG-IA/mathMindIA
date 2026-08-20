import type { AcademicLevel } from '@mathmind/shared-domain'

// US-001 Registro. El mecanismo de autenticacion (JWT vs sesion de servidor) sigue sin
// decidir (US-002, "Fuera de alcance") -- sessionToken es deliberadamente opaco.
export interface RegisterRequestDto {
  readonly email: string
  readonly password: string
  readonly academicLevel: AcademicLevel
}

export interface RegisterResponseDto {
  readonly userId: string
  readonly sessionToken: string
}

// US-002 Login.
export interface LoginRequestDto {
  readonly email: string
  readonly password: string
}

export interface LoginResponseDto {
  readonly userId: string
  readonly sessionToken: string
}

// US-009 Acceso de invitado ("Prueba sin registrarte"). Sin request body -- todos los datos
// (email/password/academicLevel) se generan en el servidor, no los aporta quien pulsa el
// boton. A diferencia de RegisterResponseDto/LoginResponseDto, incluye `email`: el cliente no
// lo conoce de antemano (lo genera el servidor), y useSessionStore.login() lo necesita para
// persistir la sesion (ver apps/mobile-app/src/api/hooks/useAuth.ts).
export interface GuestLoginResponseDto {
  readonly userId: string
  readonly sessionToken: string
  readonly email: string
}
