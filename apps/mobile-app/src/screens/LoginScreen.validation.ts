import { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from '@mathmind/shared-utils'

export interface LoginFormErrors {
  readonly email?: string
  readonly password?: string
}

// Logica pura, separada de LoginScreen.tsx para poder testearla sin renderizar React (mismo
// criterio que src/api/requests/*.ts). Los predicados vienen de @mathmind/shared-utils --
// unica fuente de verdad, compartida con RegisterUseCase (backend-api) -- este fichero solo
// aporta el texto de error en español, que es presentacion, no una regla de negocio.
export function validateLoginForm(email: string, password: string): LoginFormErrors {
  const errors: { email?: string; password?: string } = {}

  if (!isValidEmail(email)) {
    errors.email = 'Introduce un email válido'
  }

  if (!isValidPassword(password)) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
  }

  return errors
}
