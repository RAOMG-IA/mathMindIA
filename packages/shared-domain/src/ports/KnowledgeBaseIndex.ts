// Almacen vectorial de chunks consolidados (docs/ADR/ADR-014_rag.md). Agnostico de la
// tecnologia de almacenamiento (pgvector en la implementacion real, ver ADR-014) -- el puerto
// no expone embeddings a quien recupera: search() recibe texto y el adaptador real embebe la
// query internamente (con su propio Embedder inyectado), para no obligar a UC-001/UC-003 a
// depender tambien de Embedder solo para construir una query.
export interface RagChunkInput {
  readonly content: string
  readonly embedding: readonly number[]
  // De donde viene el chunk -- trazabilidad practica (que fichero, que posicion), sin acoplar
  // el puerto a RagIngestionRecord (que solo conoce quien ingiere, no quien indexa en general).
  readonly sourceFileName: string
  readonly chunkIndex: number
}

export interface KnowledgeBaseIndex {
  index(chunks: readonly RagChunkInput[]): Promise<void>
  search(queryText: string, topK: number): Promise<readonly string[]>
}
