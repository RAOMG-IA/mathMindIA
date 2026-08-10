import type { Tema } from '../entities/Tema.js'
import type { TemaCode } from '../value-objects/TemaCode.js'

// Catalogo de referencia (ADR-006), sin `save` -- no hay gobernanza formal de altas desde la
// Application layer todavia (ver "Consecuencias / Negativas" de ADR-006); se puebla por
// migracion/seed, no por un Caso de Uso.
// - findByCode: UC-005 paso 1 (validar que el Tema exista y aplique al AcademicLevel elegido)
// - findAll: GET /temas (ADR-006 adenda 2026-08-10, US-003) -- catalogo completo sin filtrar,
//   el cliente filtra por AcademicLevel localmente usando el campo academicLevels de cada Tema.
export interface TemaRepository {
  findByCode(code: TemaCode): Promise<Tema | null>
  findAll(): Promise<readonly Tema[]>
}
