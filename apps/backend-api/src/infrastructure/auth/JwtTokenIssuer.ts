import jwt from 'jsonwebtoken'
import type { TokenIssuer, UserId } from '@mathmind/shared-domain'

// Implementacion real del puerto TokenIssuer (ADR-012 ya anticipa JWT por nombre, "futuras
// claves de firma JWT"). El secreto de firma vive solo en variables de entorno (ADR-012,
// gestion de secretos) -- se inyecta por constructor, nunca hardcodeado. Igual que
// BcryptPasswordHasher, es computo puro (sin red) -- se testea de verdad.
export class JwtTokenIssuer implements TokenIssuer {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '7d',
  ) {}

  async issue(userId: UserId): Promise<string> {
    return jwt.sign({ sub: userId }, this.secret, {
      expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
    })
  }

  async verify(token: string): Promise<UserId | null> {
    try {
      // Hallazgo Security 2026-08-07: fijar el algoritmo explicitamente es defensa en
      // profundidad -- jsonwebtoken ya rechaza alg=none/RS256 por defecto aqui (solo se firma
      // con HS256, sin claves asimetricas en juego), pero no dejarlo implicito evita depender
      // de ese comportamiento por defecto mas adelante.
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] })
      if (typeof payload === 'object' && payload !== null && typeof payload.sub === 'string') {
        return payload.sub as UserId
      }
      return null
    } catch {
      return null
    }
  }
}
