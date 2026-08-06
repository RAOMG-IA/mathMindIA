import type { Answer, AnswerRepository, SessionId, UserId } from '@mathmind/shared-domain'

// Doble de test en memoria de AnswerRepository -- ver packages/shared-domain/src/repositories/AnswerRepository.ts.
// findByUserId requiere el join Answer->Session que en produccion vive en infraestructura
// (ver comentario del contrato); aqui se resuelve con el mapa auxiliar sessionOwners.
export class InMemoryAnswerRepository implements AnswerRepository {
  private readonly answers: Answer[] = []
  readonly sessionOwners = new Map<SessionId, UserId>()

  async save(answer: Answer): Promise<void> {
    this.answers.push(answer)
  }

  async findBySessionId(sessionId: SessionId): Promise<readonly Answer[]> {
    return this.answers.filter((answer) => answer.sessionId === sessionId)
  }

  async findByUserId(userId: UserId): Promise<readonly Answer[]> {
    return this.answers.filter((answer) => this.sessionOwners.get(answer.sessionId) === userId)
  }
}
