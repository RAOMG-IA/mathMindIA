import type { RegisterRequestDto } from '@mathmind/shared-types'
import { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from '@mathmind/shared-utils'

// Derivado de RegisterRequestDto en vez de depender de @mathmind/shared-domain directamente --
// evita anadir una dependencia nueva a mobile-app solo por un alias de tipo (import type se
// borra al compilar de todos modos).
export type AcademicLevel = RegisterRequestDto['academicLevel']

export interface RegisterFormErrors {
  readonly email?: string
  readonly password?: string
  readonly academicLevel?: string
}

// Logica pura, mismo criterio que LoginScreen.validation.ts. academicLevel es obligatorio
// (US-001, escenario "Nivel académico obligatorio") -- null representa "todavia sin elegir".
export function validateRegisterForm(
  email: string,
  password: string,
  academicLevel: AcademicLevel | null,
): RegisterFormErrors {
  const errors: { email?: string; password?: string; academicLevel?: string } = {}

  if (!isValidEmail(email)) {
    errors.email = 'Introduce un email válido'
  }

  if (!isValidPassword(password)) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
  }

  if (!academicLevel) {
    errors.academicLevel = 'Selecciona tu nivel académico'
  }

  return errors
}
