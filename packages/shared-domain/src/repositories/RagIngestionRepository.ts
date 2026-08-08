import type { RagIngestionRecord } from '../entities/RagIngestionRecord.js'

// save: UC-011, un registro por fichero procesado (exito o error).
export interface RagIngestionRepository {
  save(record: RagIngestionRecord): Promise<void>
}
