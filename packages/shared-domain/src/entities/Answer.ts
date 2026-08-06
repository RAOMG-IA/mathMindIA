import type { AnswerId, ExerciseId, SessionId } from './ids.js'

// Ver docs/ADR/ADR-004_domain.md. Forma persistida de un intento; UpdateDifficultyUseCase
// (UC-004) deriva su AttemptResult transitorio a partir de un Answer + el Timer del Exercise.
export interface Answer {
  readonly id: AnswerId
  readonly sessionId: SessionId
  readonly exerciseId: ExerciseId
  readonly submittedValue: string
  readonly isCorrect: boolean
  readonly responseTimeMs: number
  readonly hintsUsed: number
  readonly createdAt: Date
}
