import type { Exercise } from '../entities/Exercise.js'
import type { AcademicLevel } from '../value-objects/AcademicLevel.js'
import type { ExerciseType } from '../value-objects/ExerciseType.js'
import type { TemaCode } from '../value-objects/TemaCode.js'
import type { ExerciseId } from '../entities/ids.js'

export interface DifficultyBand {
  readonly min: number
  readonly max: number
}

export interface FindByDifficultyBandQuery {
  readonly academicLevel: AcademicLevel
  readonly topic: TemaCode
  // Hueco corregido (UC-008): sin este filtro, "siguiente ejercicio" podia devolver un Exercise
  // de un type distinto al Session.mode en curso (invariante documentada en Session.ts, nunca
  // aplicada aqui) -- un Test con options se podia colar en una sesion de Resolucion.
  readonly type: ExerciseType
  readonly band: DifficultyBand
  // Excluye ejercicios ya sevidos (respondidos) en la sesion actual -- sin esto, con pocos
  // ejercicios de la misma dificultad exacta (p. ej. un lote generado con count>1, todos con el
  // mismo targetDifficulty), "siguiente ejercicio" podia devolver siempre el mismo.
  readonly excludeIds?: readonly ExerciseId[]
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
