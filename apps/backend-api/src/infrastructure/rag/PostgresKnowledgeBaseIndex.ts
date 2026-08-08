import type { PrismaClient } from '@prisma/client'
import type { Embedder, KnowledgeBaseIndex, RagChunkInput } from '@mathmind/shared-domain'

// Implementacion de KnowledgeBaseIndex sobre PostgreSQL + pgvector. Ver docs/ADR/ADR-014_rag.md.
// `embedding` es Unsupported("vector(384)") en el schema -- invisible al query builder de
// Prisma, toda la escritura/lectura pasa por SQL crudo parametrizado ($executeRaw/$queryRaw,
// nunca concatenacion de strings). El operador `<=>` es distancia coseno (pgvector) -- menor
// valor = mas similar, de ahi el ORDER BY ascendente.
function toVectorLiteral(embedding: readonly number[]): string {
  return `[${embedding.join(',')}]`
}

export class PostgresKnowledgeBaseIndex implements KnowledgeBaseIndex {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly embedder: Embedder,
  ) {}

  async index(chunks: readonly RagChunkInput[]): Promise<void> {
    for (const chunk of chunks) {
      const id = crypto.randomUUID()
      const vector = toVectorLiteral(chunk.embedding)
      await this.prisma.$executeRaw`
        INSERT INTO rag_chunks (id, source_file_name, chunk_index, content, embedding)
        VALUES (${id}, ${chunk.sourceFileName}, ${chunk.chunkIndex}, ${chunk.content}, ${vector}::vector)
      `
    }
  }

  async search(queryText: string, topK: number): Promise<readonly string[]> {
    const queryEmbedding = await this.embedder.embed(queryText)
    const vector = toVectorLiteral(queryEmbedding)
    const rows = await this.prisma.$queryRaw<readonly { content: string }[]>`
      SELECT content FROM rag_chunks ORDER BY embedding <=> ${vector}::vector LIMIT ${topK}
    `
    return rows.map((row) => row.content)
  }
}
