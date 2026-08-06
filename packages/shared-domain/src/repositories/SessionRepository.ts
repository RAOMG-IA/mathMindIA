import type { Session } from '../entities/Session.js'
import type { SessionId } from '../entities/ids.js'

// - findById: UC-002/UC-006/UC-008 (leer mode/academicLevel/endedAt de la sesion activa)
// - save: upsert -- UC-005 (crear), UC-006 (marcar endedAt)
export interface SessionRepository {
  findById(id: SessionId): Promise<Session | null>
  save(session: Session): Promise<void>
}
