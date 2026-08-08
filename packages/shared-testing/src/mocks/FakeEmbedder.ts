import type { Embedder } from '@mathmind/shared-domain'

// Fake deterministico de Embedder -- ver packages/shared-domain/src/ports/Embedder.ts. No
// tiene semantica real (a diferencia del modelo local de verdad, XenovaEmbedder): solo
// garantiza que textos iguales producen el mismo vector, suficiente para testear que el
// embedding calculado se propaga correctamente sin depender de descargar un modelo real.
// 384 dimensiones -- misma que XenovaEmbedder (Xenova/all-MiniLM-L6-v2, ver ADR-014_rag.md) y
// que la columna `vector(384)` de RagChunk; pgvector rechaza cualquier otra dimension
// (hueco detectado al ejecutar PostgresKnowledgeBaseIndex.integration.test.ts contra pgvector
// real por primera vez, antes solo se habia confirmado el Red).
const DIMENSIONS = 384

export class FakeEmbedder implements Embedder {
  async embed(text: string): Promise<readonly number[]> {
    const vector = new Array(DIMENSIONS).fill(0)
    for (let i = 0; i < text.length; i += 1) {
      vector[i % DIMENSIONS] += text.charCodeAt(i)
    }
    return vector.map((value) => value / (text.length || 1))
  }
}
