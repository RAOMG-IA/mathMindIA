import type { RagIngestionStatus } from '../value-objects/RagIngestionStatus.js'
import type { RagIngestionRecordId } from './ids.js'

// Un registro por fichero procesado por UC-011 (docs/ADR/ADR-014_rag.md). Sin referencia a
// Tema/Exercise a proposito -- la asociacion fichero->Tema no ocurre en la ingesta, ocurre por
// similitud semantica al generar (ver UC-001/UC-003).
export interface RagIngestionRecord {
  readonly id: RagIngestionRecordId
  readonly fileName: string
  readonly status: RagIngestionStatus
  readonly errorMessage?: string
  readonly chunkCount: number
  readonly processedAt: Date
}
