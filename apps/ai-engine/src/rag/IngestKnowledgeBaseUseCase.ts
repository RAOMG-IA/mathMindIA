import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import type {
  Clock,
  Embedder,
  IdGenerator,
  IngestionFileSystem,
  KnowledgeBaseIndex,
  RagIngestionRecordId,
  RagIngestionRepository,
} from '@mathmind/shared-domain'

// Ver docs/use-cases/UC-011-ingest-knowledge-base.md y docs/ADR/ADR-014_rag.md.
export interface IngestKnowledgeBaseOutput {
  readonly processedCount: number
  readonly errorCount: number
}

// v1: solo texto plano/Markdown (ADR-014, "Fuera de alcance" de esta iteracion). Se detecta
// por extension -- no hay parseo de contenido que pueda distinguir un PDF corrupto de uno
// valido sin una libreria de extraccion que este ADR deja fuera de alcance a proposito.
const SUPPORTED_EXTENSIONS = ['.txt', '.md']

// Judgment call documentado en ADR-014 (tamano/overlap "a definir al implementar", mismo
// criterio que otras constantes de la sesion, p.ej. MAX_ATTEMPTS en GenerateExerciseBatchUseCase).
const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 100

function isSupportedFormat(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return SUPPORTED_EXTENSIONS.some((extension) => lower.endsWith(extension))
}

export class IngestKnowledgeBaseUseCase {
  constructor(
    private readonly fileSystem: IngestionFileSystem,
    private readonly embedder: Embedder,
    private readonly index: KnowledgeBaseIndex,
    private readonly ingestionRepository: RagIngestionRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<IngestKnowledgeBaseOutput> {
    const fileNames = await this.fileSystem.listInputFiles()
    let processedCount = 0
    let errorCount = 0

    for (const fileName of fileNames) {
      const chunkCount = await this.processFile(fileName)
      if (chunkCount === null) {
        errorCount += 1
      } else {
        processedCount += 1
      }
      await this.fileSystem.moveToHistory(fileName)
    }

    return { processedCount, errorCount }
  }

  // Devuelve el numero de chunks indexados, o null si el fichero se registro como Error.
  // Flujo 2a (UC-011): un fichero invalido no bloquea el resto -- el error se contiene aqui,
  // nunca se propaga fuera de execute().
  private async processFile(fileName: string): Promise<number | null> {
    try {
      if (!isSupportedFormat(fileName)) {
        throw new Error(`Unsupported file format: ${fileName}`)
      }

      const content = await this.fileSystem.readFile(fileName)
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: CHUNK_SIZE,
        chunkOverlap: CHUNK_OVERLAP,
      })
      const chunks = await splitter.splitText(content)

      const embeddedChunks = await Promise.all(
        chunks.map(async (chunkContent, chunkIndex) => ({
          content: chunkContent,
          embedding: await this.embedder.embed(chunkContent),
          sourceFileName: fileName,
          chunkIndex,
        })),
      )
      await this.index.index(embeddedChunks)

      await this.ingestionRepository.save({
        id: this.ids.generate() as RagIngestionRecordId,
        fileName,
        status: 'Processed',
        chunkCount: chunks.length,
        processedAt: this.clock.now(),
      })
      return chunks.length
    } catch (error) {
      await this.ingestionRepository.save({
        id: this.ids.generate() as RagIngestionRecordId,
        fileName,
        status: 'Error',
        errorMessage: error instanceof Error ? error.message : 'Unknown ingestion error',
        chunkCount: 0,
        processedAt: this.clock.now(),
      })
      return null
    }
  }
}
