import type { User } from '../entities/User.js'
import type { UserId } from '../entities/ids.js'

// Metodos derivados de los UC/US que los usan -- no CRUD especulativo:
// - findById: UC-008 (obtener userRating), UC-007 (estadisticas)
// - findByEmail: US-001, escenario "email ya registrado"
// - save: upsert -- US-001 (crear), UC-004 (persistir nextUserRating)
export interface UserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
}
