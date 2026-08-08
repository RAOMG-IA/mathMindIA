// Genera el embedding de un texto (chunk a indexar, o query de recuperacion). Ver
// docs/ADR/ADR-014_rag.md -- implementacion real local, sin llamada a red (Xenova/transformers).
export interface Embedder {
  embed(text: string): Promise<readonly number[]>
}
