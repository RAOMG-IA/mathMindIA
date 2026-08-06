import type { Exercise } from '../entities/Exercise.js'
import type { AcademicLevel } from '../value-objects/AcademicLevel.js'
import type { TemaCode } from '../value-objects/TemaCode.js'
import type { ExerciseId } from '../entities/ids.js'

export interface DifficultyBand {
  readonly min: number
  readonly max: number
}

export interface FindByDifficultyBandQuery {
  readonly academicLevel: AcademicLevel
  readonly topic: TemaCode
  readonly band: DifficultyBand
}

// - findById: UC-002/UC-003 (leer correctAnswer, timeLimit, type del ejercicio respondido)
// - findByDifficultyBand: UC-008 (seleccionar siguiente ejercicio, banda +/-150 de ADR-005;
//   ya nombrado como ExercisePool.findByDifficultyBand en ADR-004)
// - save: upsert -- UC-001 (crear, generado por IA), UC-004 (persistir nextExerciseRating)
export interface ExerciseRepository {
  findById(id: ExerciseId): Promise<Exercise | null>
  findByDifficultyBand(query: FindByDifficultyBandQuery): Promise<readonly Exercise[]>
  save(exercise: Exercise): Promise<void>
}
