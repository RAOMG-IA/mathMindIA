import bcrypt from 'bcrypt'
import type { PasswordHasher } from '@mathmind/shared-domain'

// Implementacion real del puerto PasswordHasher (ADR-012: "hash con algoritmo estandar bcrypt
// o argon2"). A diferencia de LangChainChatModel/Prisma*, bcrypt es computo puro (sin red ni
// DB) -- se testea de verdad, no queda como gap aceptado.
const SALT_ROUNDS = 12

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS)
  }

  async verify(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash)
  }
}
