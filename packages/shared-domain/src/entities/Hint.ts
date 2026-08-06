import type { ExerciseId, HintId } from './ids.js'

// Ver docs/ADR/ADR-004_domain.md. Solo aplica a Exercise de type 'Resolution'.
export interface Hint {
  readonly id: HintId
  readonly exerciseId: ExerciseId
  readonly order: number
  readonly content: string
}
