import type { ExerciseId, Hint, HintRepository } from '@mathmind/shared-domain'

// Doble de test en memoria de HintRepository -- ver packages/shared-domain/src/repositories/HintRepository.ts.
export class InMemoryHintRepository implements HintRepository {
  private readonly hints = new Map<string, Hint>()

  private key(exerciseId: ExerciseId, order: number): string {
    return `${exerciseId}:${order}`
  }

  async findByExerciseIdAndOrder(exerciseId: ExerciseId, order: number): Promise<Hint | null> {
    return this.hints.get(this.key(exerciseId, order)) ?? null
  }

  async save(hint: Hint): Promise<void> {
    this.hints.set(this.key(hint.exerciseId, hint.order), hint)
  }
}
