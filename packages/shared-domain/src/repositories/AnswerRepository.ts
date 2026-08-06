import type { Answer } from '../entities/Answer.js'
import type { SessionId, UserId } from '../entities/ids.js'

// - save: UC-002 (crear cada intento)
// - findBySessionId: UC-006 (resumen de sesion: aciertos, tiempo medio)
// - findByUserId: UC-007 (estadisticas agregadas por tema) -- implica join con Session
//   en la implementacion futura (Answer no tiene userId propio, ver ADR-004); el contrato
//   de dominio puede expresar la consulta igualmente, es responsabilidad de infraestructura.
export interface AnswerRepository {
  save(answer: Answer): Promise<void>
  findBySessionId(sessionId: SessionId): Promise<readonly Answer[]>
  findByUserId(userId: UserId): Promise<readonly Answer[]>
}
