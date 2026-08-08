import type { RagIngestionRecord, RagIngestionRepository } from '@mathmind/shared-domain'

// Doble de test en memoria de RagIngestionRepository -- ver
// packages/shared-domain/src/repositories/RagIngestionRepository.ts.
export class InMemoryRagIngestionRepository implements RagIngestionRepository {
  readonly records: RagIngestionRecord[] = []

  async save(record: RagIngestionRecord): Promise<void> {
    this.records.push(record)
  }
}
