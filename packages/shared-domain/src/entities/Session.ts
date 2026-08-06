import type { AcademicLevel } from '../value-objects/AcademicLevel.js'
import type { ExerciseType } from '../value-objects/ExerciseType.js'
import type { SessionId, UserId } from './ids.js'

// Ver docs/ADR/ADR-004_domain.md.
// Invariante: todo Answer asociado referencia un Exercise cuyo type coincide con mode.
export interface Session {
  readonly id: SessionId
  readonly userId: UserId
  readonly mode: ExerciseType
  readonly academicLevel: AcademicLevel
  readonly startedAt: Date
  readonly endedAt?: Date
}
