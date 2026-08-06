import type { QwenClient } from '@mathmind/ai-engine'
import type { Exercise } from '@mathmind/shared-domain'
import type { HintGenerator } from '../../application/use-cases/GenerateHintUseCase.js'

// Adaptador real del puerto HintGenerator (GenerateHintUseCase.ts, UC-003) -- envuelve
// QwenClient (packages @mathmind/ai-engine, import directo in-process, ver ADR-001). Solo
// necesita el metodo generateHint de QwenClient (Pick, no la clase completa) para poder
// inyectar un fake estructural en tests sin depender de LangChain real.
//
export class QwenHintGenerator implements HintGenerator {
  constructor(private readonly qwen: Pick<QwenClient, 'generateHint'>) {}

  async generate(input: {
    exercise: Exercise
    order: number
    previousHints: readonly string[]
  }): Promise<{ content: string }> {
    const result = await this.qwen.generateHint({
      exerciseStatement: input.exercise.statement,
      correctAnswer: input.exercise.correctAnswer,
      previousHints: input.previousHints,
      hintOrder: input.order,
    })

    return { content: result.content }
  }
}
