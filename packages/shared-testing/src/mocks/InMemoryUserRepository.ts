import type { User, UserId, UserRepository } from '@mathmind/shared-domain'

// Doble de test en memoria de UserRepository -- ver packages/shared-domain/src/repositories/UserRepository.ts.
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<UserId, User>()

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id) ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user)
  }
}
