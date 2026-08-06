import type { AcademicLevel } from '../value-objects/AcademicLevel.js'
import type { TemaCode } from '../value-objects/TemaCode.js'

// Ver docs/ADR/ADR-006_math_topics.md ("Esquema de Tema"). Catalogo de referencia (2 niveles,
// Area -> Tema), no un agregado mutable desde la Application layer -- ver TemaRepository.
export type AreaCode = 'arit' | 'alg' | 'geo' | 'est' | 'calc'

export interface TemaAcademicLevelRange {
  readonly level: AcademicLevel
  readonly difficultyRange: { readonly min: number; readonly max: number }
}

export interface Tema {
  readonly code: TemaCode
  readonly area: AreaCode
  readonly label: string
  readonly description: string
  readonly academicLevels: readonly TemaAcademicLevelRange[]
  readonly prerequisites?: readonly TemaCode[]
}
