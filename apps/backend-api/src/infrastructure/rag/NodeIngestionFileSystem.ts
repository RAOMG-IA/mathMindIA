import { copyFile, readFile as readFileFs, readdir, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import type { IngestionFileSystem } from '@mathmind/shared-domain'

// Implementacion real de IngestionFileSystem sobre fs/promises. Ver docs/ADR/ADR-014_rag.md.
// El tercer parametro (fs) es inyectable para tests unitarios; por defecto usa node:fs/promises.
export interface FileSystemOperations {
  readonly readdir: (path: string) => Promise<readonly string[]>
  readonly readFile: (path: string, encoding: 'utf-8') => Promise<string>
  readonly rename: (from: string, to: string) => Promise<void>
  readonly copyFile: (from: string, to: string) => Promise<void>
  readonly unlink: (path: string) => Promise<void>
}

export class NodeIngestionFileSystem implements IngestionFileSystem {
  constructor(
    private readonly inputDir: string,
    private readonly historyDir: string,
    private readonly fs: FileSystemOperations = {
      readdir,
      readFile: readFileFs,
      rename,
      copyFile,
      unlink,
    },
  ) {}

  async listInputFiles(): Promise<readonly string[]> {
    return this.fs.readdir(this.inputDir)
  }

  async readFile(fileName: string): Promise<string> {
    return this.fs.readFile(join(this.inputDir, fileName), 'utf-8')
  }

  async moveToHistory(fileName: string): Promise<void> {
    const source = join(this.inputDir, fileName)
    const dest = join(this.historyDir, fileName)
    try {
      await this.fs.rename(source, dest)
    } catch (error) {
      // Hallazgo de la verificacion DevOps (2026-08-10): en el contenedor Docker, rag/input y
      // rag/history son dos bind mounts separados y rename() entre ellos falla con EXDEV
      // ("cross-device link not permitted") -- en el host no ocurre (mismo filesystem), por
      // eso no aparecio en la verificacion local. rename() es atomico y preferido; solo ante
      // EXDEV se cae a copia+borrado (no atomico pero correcto para este flujo).
      if (!isCrossDeviceError(error)) {
        throw error
      }
      await this.fs.copyFile(source, dest)
      await this.fs.unlink(source)
    }
  }
}

function isCrossDeviceError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'EXDEV'
  )
}
