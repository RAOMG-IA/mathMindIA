import type { KnowledgeBaseIndex, RagChunkInput } from '@mathmind/shared-domain'

function wordsOf(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/\W+/).filter(Boolean))
}

function overlapScore(queryWords: Set<string>, content: string): number {
  const contentWords = wordsOf(content)
  let score = 0
  for (const word of queryWords) {
    if (contentWords.has(word)) score += 1
  }
  return score
}

// Doble de test en memoria de KnowledgeBaseIndex -- ver packages/shared-domain/src/ports/KnowledgeBaseIndex.ts.
// search() no hace similitud vectorial real (eso lo prueba PostgresKnowledgeBaseIndex contra
// Postgres real) -- usa solape de palabras, suficiente para testear que la recuperacion se
// invoca y su resultado se propaga como contexto, sin necesitar un Embedder inyectado.
export class InMemoryKnowledgeBaseIndex implements KnowledgeBaseIndex {
  private readonly chunks: RagChunkInput[] = []

  async index(chunks: readonly RagChunkInput[]): Promise<void> {
    this.chunks.push(...chunks)
  }

  async search(queryText: string, topK: number): Promise<readonly string[]> {
    const queryWords = wordsOf(queryText)
    return this.chunks
      .map((chunk) => ({ content: chunk.content, score: overlapScore(queryWords, chunk.content) }))
      .filter((scored) => scored.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((scored) => scored.content)
  }
}
