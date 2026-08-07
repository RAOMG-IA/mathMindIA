import type { PasswordHasher } from '@mathmind/shared-domain'

// Fake deterministico de PasswordHasher -- ver packages/shared-domain/src/ports/PasswordHasher.ts.
// No usa un algoritmo real: solo un prefijo reconocible, suficiente para testear el flujo sin
// depender de bcrypt (que sí se testea por separado, ver BcryptPasswordHasher.test.ts).
export class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return `hashed:${plainPassword}`
  }

  async verify(plainPassword: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plainPassword}`
  }
}
