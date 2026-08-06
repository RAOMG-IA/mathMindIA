import type { AcademicLevel } from '../value-objects/AcademicLevel.js'
import type { Difficulty } from '../value-objects/Difficulty.js'
import type { ExerciseType } from '../value-objects/ExerciseType.js'
import type { TemaCode } from '../value-objects/TemaCode.js'
import type { Timer } from '../value-objects/Timer.js'
import type { ExerciseId } from './ids.js'

// Ver docs/ADR/ADR-004_domain.md.
// Invariante: type = 'Test' => options tiene exactamente 3 elementos y correctAnswer in options.
// type = 'Resolution' => options es undefined. No se valida aqui (tipo puro, sin logica);
// la validacion vive en la implementacion, con tests, cuando se aborde.
export interface Exercise {
  readonly id: ExerciseId
  readonly type: ExerciseType
  readonly academicLevel: AcademicLevel
  readonly topic: TemaCode
  readonly statement: string
  readonly options?: readonly [string, string, string]
  readonly correctAnswer: string
  readonly difficulty: Difficulty
  readonly timer: Timer
  readonly explanation: string
  readonly generatedBy: 'ai-batch' | 'manual'
}
