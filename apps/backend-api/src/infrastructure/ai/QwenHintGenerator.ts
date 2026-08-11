import type { IAClient } from '@mathmind/ai-engine'
import type { Exercise, KnowledgeBaseIndex } from '@mathmind/shared-domain'
import type { HintGenerator } from '../../application/use-cases/GenerateHintUseCase.js'

// UC-003 paso 4 (retrieval, ADR-014_rag.md): cuantos chunks recuperar como maximo.
// Judgment call documentado, mismo criterio que TOP_K en GenerateExerciseBatchUseCase.
const TOP_K = 3

// Adaptador real del puerto HintGenerator (GenerateHintUseCase.ts, UC-003) -- envuelve
// IAClient (packages @mathmind/ai-engine, import directo in-process, ver ADR-001; clase
// renombrada desde QwenClient, nombre historico, ver IAClient.ts). Solo necesita el metodo
// generateHint de IAClient (Pick, no la clase completa) para poder inyectar un fake
// estructural en tests sin depender de LangChain real.
//
export class QwenHintGenerator implements HintGenerator {
  constructor(
    private readonly ia: Pick<IAClient, 'generateHint'>,
    private readonly knowledgeBase: KnowledgeBaseIndex,
  ) {}

  async generate(input: {
    exercise: Exercise
    order: number
    previousHints: readonly string[]
  }): Promise<{ content: string }> {
    // Sin tagging fichero->Tema en la ingesta -- la query sale de lo que ya se conoce del
    // Exercise (mas especifico que el Tema solo, ver ADR-014_rag.md).
    const query = `${input.exercise.topic} ${input.exercise.statement}`
    const context = await this.knowledgeBase.search(query, TOP_K)

    const result = await this.ia.generateHint({
      exerciseStatement: input.exercise.statement,
      correctAnswer: input.exercise.correctAnswer,
      previousHints: input.previousHints,
      hintOrder: input.order,
      context,
    })

    return { content: result.content }
  }
}
