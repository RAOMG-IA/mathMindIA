import { ChatOpenAI } from '@langchain/openai'
import type { ChatModel } from './ChatModel.js'

// Implementacion real de ChatModel: envuelve ChatOpenAI de LangChain contra el endpoint
// OpenAI-compatible de Qwen/DashScope (QWEN_API_KEY/QWEN_BASE_URL, ver .env.example).
// ADR-001: transporte backend-api<->ai-engine es import directo in-process, no HTTP -- este
// adaptador es lo unico que habla con la red real, por eso queda sin tests automaticos (gap
// aceptado explicitamente, misma razon que las implementaciones Prisma*Repository).
export class LangChainQwenModel implements ChatModel {
  private readonly client: ChatOpenAI

  constructor(apiKey: string, baseURL: string, modelName = 'qwen-plus') {
    this.client = new ChatOpenAI({
      apiKey,
      model: modelName,
      configuration: { baseURL },
    })
  }

  async invoke(prompt: string): Promise<string> {
    const response = await this.client.invoke(prompt)
    return typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
  }
}
