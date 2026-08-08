import type { IngestionFileSystem } from '@mathmind/shared-domain'

// Doble de test en memoria de IngestionFileSystem -- ver
// packages/shared-domain/src/ports/IngestionFileSystem.ts. `inputFiles` se puebla en el
// constructor (seed); moveToHistory() lo saca de ahi y lo anade a `historyFiles` (publico,
// para que los tests puedan comprobar que el fichero se movio de verdad).
export class InMemoryIngestionFileSystem implements IngestionFileSystem {
  private readonly inputFiles: Map<string, string>
  readonly historyFiles: string[] = []

  constructor(seed: Readonly<Record<string, string>> = {}) {
    this.inputFiles = new Map(Object.entries(seed))
  }

  async listInputFiles(): Promise<readonly string[]> {
    return [...this.inputFiles.keys()]
  }

  async readFile(fileName: string): Promise<string> {
    const content = this.inputFiles.get(fileName)
    if (content === undefined) {
      throw new Error(`File not found in input directory: ${fileName}`)
    }
    return content
  }

  async moveToHistory(fileName: string): Promise<void> {
    this.inputFiles.delete(fileName)
    this.historyFiles.push(fileName)
  }
}
