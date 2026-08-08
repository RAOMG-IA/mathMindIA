import { readFile as readFileFs, readdir, rename } from 'node:fs/promises'
import { join } from 'node:path'
import type { IngestionFileSystem } from '@mathmind/shared-domain'

// Implementacion real de IngestionFileSystem sobre fs/promises. Ver docs/ADR/ADR-014_rag.md.
export class NodeIngestionFileSystem implements IngestionFileSystem {
  constructor(
    private readonly inputDir: string,
    private readonly historyDir: string,
  ) {}

  async listInputFiles(): Promise<readonly string[]> {
    return readdir(this.inputDir)
  }

  async readFile(fileName: string): Promise<string> {
    return readFileFs(join(this.inputDir, fileName), 'utf-8')
  }

  async moveToHistory(fileName: string): Promise<void> {
    await rename(join(this.inputDir, fileName), join(this.historyDir, fileName))
  }
}
