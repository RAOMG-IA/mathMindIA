import type { ExerciseId, HintUsageTracker, SessionId } from '@mathmind/shared-domain'

// Doble de test en memoria de HintUsageTracker -- ver packages/shared-domain/src/ports/HintUsageTracker.ts.
export class InMemoryHintUsageTracker implements HintUsageTracker {
  private readonly counts = new Map<string, number>()

  private key(sessionId: SessionId, exerciseId: ExerciseId): string {
    return `${sessionId}:${exerciseId}`
  }

  async incrementAndGet(sessionId: SessionId, exerciseId: ExerciseId): Promise<number> {
    const key = this.key(sessionId, exerciseId)
    const next = (this.counts.get(key) ?? 0) + 1
    this.counts.set(key, next)
    return next
  }

  async get(sessionId: SessionId, exerciseId: ExerciseId): Promise<number> {
    return this.counts.get(this.key(sessionId, exerciseId)) ?? 0
  }
}
