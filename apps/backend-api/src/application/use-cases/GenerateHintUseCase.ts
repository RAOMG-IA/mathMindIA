import type {
  Exercise,
  ExerciseId,
  ExerciseRepository,
  HintId,
  HintRepository,
  HintUsageTracker,
  IdGenerator,
  SessionId,
  SessionRepository,
} from '@mathmind/shared-domain'

// Ver docs/use-cases/UC-003-generate-hint.md y docs/ADR/ADR-004_domain.md.
// HintGenerator es la abstraccion que la Application layer usa para no depender directamente
// de apps/ai-engine (app separada, ver ARCHITECTURE.md -- Backend API y AI Engine son cajas
// distintas). Implementacion real: apps/backend-api/src/infrastructure/ai/QwenHintGenerator.ts
// (envuelve QwenClient, import directo in-process -- ver ADR-001).
// previousHints: pistas ya generadas para este ejercicio, en orden, para progresion (US-005,
// "Pistas progresivas") -- GenerateHintUseCase las recopila via HintRepository antes de llamar.
export interface HintGenerator {
  generate(input: {
    exercise: Exercise
    order: number
    previousHints: readonly string[]
  }): Promise<{ content: string }>
}

export interface GenerateHintInput {
  readonly sessionId: SessionId
  readonly exerciseId: ExerciseId
  readonly elapsedMs: number
}

// order == hintsUsedSoFar (packages/shared-types/src/dtos/Hint.ts) -- Presentation traslada
// este valor a Answer.hintsUsed cuando se cree el Answer final (UC-002).
export interface GenerateHintOutput {
  readonly content: string
  readonly order: number
}

export class GenerateHintUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly exercises: ExerciseRepository,
    private readonly hints: HintRepository,
    private readonly hintUsage: HintUsageTracker,
    private readonly hintGenerator: HintGenerator,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: GenerateHintInput): Promise<GenerateHintOutput> {
    const session = await this.sessions.findById(input.sessionId)
    if (!session || session.endedAt) {
      throw new Error(`No active session: ${input.sessionId}`)
    }

    const exercise = await this.exercises.findById(input.exerciseId)
    if (!exercise) {
      throw new Error(`Exercise not found: ${input.exerciseId}`)
    }

    if (exercise.type !== 'Resolution') {
      throw new Error('Hints are only available for Resolution exercises')
    }

    if (input.elapsedMs < exercise.timer.limitMs) {
      throw new Error('Time limit has not expired yet')
    }

    const order = await this.hintUsage.incrementAndGet(input.sessionId, input.exerciseId)

    const existing = await this.hints.findByExerciseIdAndOrder(input.exerciseId, order)
    if (existing) {
      return { content: existing.content, order }
    }

    const previousHints: string[] = []
    for (let priorOrder = 1; priorOrder < order; priorOrder += 1) {
      const prior = await this.hints.findByExerciseIdAndOrder(input.exerciseId, priorOrder)
      if (prior) {
        previousHints.push(prior.content)
      }
    }

    const generated = await this.hintGenerator.generate({ exercise, order, previousHints })
    await this.hints.save({
      id: this.ids.generate() as HintId,
      exerciseId: input.exerciseId,
      order,
      content: generated.content,
    })

    return { content: generated.content, order }
  }
}
