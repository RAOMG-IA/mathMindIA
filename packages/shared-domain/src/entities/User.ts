import type { AcademicLevel } from '../value-objects/AcademicLevel.js'
import type { Difficulty } from '../value-objects/Difficulty.js'
import type { Score } from '../value-objects/Score.js'
import type { UserId } from './ids.js'

// Ver docs/ADR/ADR-004_domain.md. El email es un atributo de identidad del dominio
// (necesario para US-001, deteccion de email duplicado); las credenciales (hash de
// contrasena, tokens) quedan fuera de alcance (responsabilidad de backend-api).
export interface User {
  readonly id: UserId
  readonly email: string
  readonly academicLevel: AcademicLevel
  // Un rating por nivel explorado, no solo el actual -- ver ADR-005.
  readonly ratings: ReadonlyMap<AcademicLevel, Difficulty>
  readonly currentStreak: number
  readonly score: Score
  readonly createdAt: Date
}
