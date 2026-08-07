import type { TokenIssuer, UserId } from '@mathmind/shared-domain'

// Fake deterministico de TokenIssuer -- ver packages/shared-domain/src/ports/TokenIssuer.ts.
// Sin JWT real: solo un prefijo reconocible, suficiente para testear el flujo sin depender de
// jsonwebtoken (que sí se testea por separado, ver JwtTokenIssuer.test.ts).
export class FakeTokenIssuer implements TokenIssuer {
  async issue(userId: UserId): Promise<string> {
    return `token-for-${userId}`
  }

  async verify(token: string): Promise<UserId | null> {
    const prefix = 'token-for-'
    if (!token.startsWith(prefix)) {
      return null
    }
    return token.slice(prefix.length) as UserId
  }
}
