import type { Hint } from '../entities/Hint.js'
import type { ExerciseId } from '../entities/ids.js'

// - findByExerciseIdAndOrder: UC-003 paso 3 (reutilizar pista ya generada para ese order)
// - save: UC-003 paso 4 (persistir pista nueva generada por Qwen)
export interface HintRepository {
  findByExerciseIdAndOrder(exerciseId: ExerciseId, order: number): Promise<Hint | null>
  save(hint: Hint): Promise<void>
}
