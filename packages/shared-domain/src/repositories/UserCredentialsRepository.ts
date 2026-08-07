import type { UserCredentials } from '../entities/UserCredentials.js'
import type { UserId } from '../entities/ids.js'

// - findByUserId: UC-010 (verificar contrasena en login)
// - save: UC-009 (crear, al registrarse)
export interface UserCredentialsRepository {
  findByUserId(userId: UserId): Promise<UserCredentials | null>
  save(credentials: UserCredentials): Promise<void>
}
