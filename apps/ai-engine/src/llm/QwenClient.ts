import type { ChatModel } from './ChatModel.js'
import { buildGenerateExercisePrompt, generateExerciseOutputsSchema } from '../prompts/GenerateExercise.js'
import type { GenerateExerciseInput, GenerateExerciseOutput } from '../prompts/GenerateExercise.js'
import { buildGenerateHintPrompt, generateHintOutputSchema } from '../prompts/GenerateHint.js'
import type { GenerateHintInput, GenerateHintOutput } from '../prompts/GenerateHint.js'

// Cliente LLM (nombre historico "Qwen", ver ADR-001 -- en la practica agnostico de proveedor,
// cualquier endpoint compatible con la API de OpenAI). Ver ARCHITECTURE.md "Estrategia IA" --
// solo se invoca desde UC-001 (batch) y UC-003 (pistas), nunca en el flujo critico de
// una peticion de usuario (ver UC-008, que es determinista y no usa este cliente).
// Recibe ChatModel por constructor (puerto local, ver ChatModel.ts) -- desacopla de
// LangChain concreto y permite TDD sin red real; la implementacion real que envuelve
// LangChain es LangChainChatModel.ts.
export class QwenClient {
  constructor(private readonly model: ChatModel) {}

  async generateExercise(input: GenerateExerciseInput): Promise<GenerateExerciseOutput> {
    const results = await this.generateExercises(input)
    const [first] = results
    if (!first) throw new Error('QwenClient.generateExercise: empty result array')
    return first
  }

  async generateExercises(input: GenerateExerciseInput): Promise<GenerateExerciseOutput[]> {
    const raw = await this.model.invoke(buildGenerateExercisePrompt(input))
    return generateExerciseOutputsSchema.parse(JSON.parse(raw))
  }

  async generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
    const raw = await this.model.invoke(buildGenerateHintPrompt(input))
    return generateHintOutputSchema.parse(JSON.parse(raw))
  }
}
