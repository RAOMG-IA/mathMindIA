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
