import { pipeline } from '@xenova/transformers'
import type { Embedder } from '@mathmind/shared-domain'

// Implementacion real de Embedder (packages/shared-domain) con un modelo local -- sin llamada
// a red en tiempo de ejecucion, salvo la descarga del modelo desde HuggingFace Hub la primera
// vez que se usa (se cachea en disco despues). Ver docs/ADR/ADR-014_rag.md.
// Sin test automatico -- mismo criterio que LangChainChatModel: depende de un recurso externo
// (descarga de red la primera vez), gap aceptado explicitamente.
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'

type FeatureExtractionPipeline = (
  text: string,
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: Float32Array | number[] }>

export class XenovaEmbedder implements Embedder {
  private pipelinePromise: Promise<FeatureExtractionPipeline> | undefined

  private getPipeline(): Promise<FeatureExtractionPipeline> {
    if (!this.pipelinePromise) {
      this.pipelinePromise = pipeline('feature-extraction', MODEL_NAME) as Promise<FeatureExtractionPipeline>
    }
    return this.pipelinePromise
  }

  async embed(text: string): Promise<readonly number[]> {
    const extractor = await this.getPipeline()
    const output = await extractor(text, { pooling: 'mean', normalize: true })
    return Array.from(output.data)
  }
}
