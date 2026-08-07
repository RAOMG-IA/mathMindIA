import type { UserId } from './ids.js'

// Ver docs/ADR/ADR-004_domain.md: "las credenciales (hash de contrasena, tokens) quedan fuera
// de alcance [de User], responsabilidad de backend-api" -- decision original, materializada
// aqui al construir UC-009/UC-010. Deliberadamente separado de User (que sigue sin campo de
// contrasena) para no mezclar el agregado de dominio con un dato puramente de autenticacion.
export interface UserCredentials {
  readonly userId: UserId
  readonly passwordHash: string
}
