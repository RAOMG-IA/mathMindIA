// Acceso al directorio de entrada/historico de UC-011 (docs/ADR/ADR-014_rag.md). Puerto
// deliberadamente minimo -- listar, leer, mover. La implementacion real usa fs/promises
// sobre RAG_INPUT_DIR/RAG_HISTORY_DIR (apps/backend-api/.env.example).
export interface IngestionFileSystem {
  listInputFiles(): Promise<readonly string[]>
  readFile(fileName: string): Promise<string>
  moveToHistory(fileName: string): Promise<void>
}
