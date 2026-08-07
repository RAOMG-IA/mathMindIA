import type { UserId } from '../entities/ids.js'

// Puerto para emitir/verificar el token de sesion opaco (RegisterResponseDto/LoginResponseDto,
// packages/shared-types/src/dtos/Auth.ts). ADR-012 ya anticipa JWT por nombre ("futuras claves
// de firma JWT") como mecanismo de secretos -- implementacion real en
// apps/backend-api/src/infrastructure/auth. verify devuelve null si el token es invalido o
// expiro (nunca lanza para ese caso -- lanzar es para errores de infraestructura, no de token).
export interface TokenIssuer {
  issue(userId: UserId): Promise<string>
  verify(token: string): Promise<UserId | null>
}
