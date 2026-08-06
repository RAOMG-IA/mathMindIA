import type { Session, SessionId, SessionRepository } from '@mathmind/shared-domain'

// Doble de test en memoria de SessionRepository -- ver packages/shared-domain/src/repositories/SessionRepository.ts.
export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<SessionId, Session>()

  async findById(id: SessionId): Promise<Session | null> {
    return this.sessions.get(id) ?? null
  }

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id, session)
  }
}
