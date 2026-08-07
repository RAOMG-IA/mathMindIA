import type { UserCredentials, UserCredentialsRepository, UserId } from '@mathmind/shared-domain'

// Doble de test en memoria de UserCredentialsRepository -- ver
// packages/shared-domain/src/repositories/UserCredentialsRepository.ts.
export class InMemoryUserCredentialsRepository implements UserCredentialsRepository {
  private readonly credentials = new Map<UserId, UserCredentials>()

  async findByUserId(userId: UserId): Promise<UserCredentials | null> {
    return this.credentials.get(userId) ?? null
  }

  async save(credentials: UserCredentials): Promise<void> {
    this.credentials.set(credentials.userId, credentials)
  }
}
