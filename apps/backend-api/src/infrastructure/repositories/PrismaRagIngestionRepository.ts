import type { PrismaClient } from '@prisma/client'
import type { RagIngestionRecord, RagIngestionRepository } from '@mathmind/shared-domain'

// Implementacion de RagIngestionRepository sobre Prisma. Ver docs/ADR/ADR-014_rag.md
// (tabla `rag_ingestion_records`). RagIngestionStatus del dominio ('Processed'/'Error')
// coincide con los nombres de miembro del enum de Prisma -- sin conversion necesaria
// (a diferencia de GeneratedBy en PrismaExerciseRepository).
export class PrismaRagIngestionRepository implements RagIngestionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: RagIngestionRecord): Promise<void> {
    await this.prisma.ragIngestionRecord.create({
      data: {
        id: record.id,
        fileName: record.fileName,
        status: record.status,
        errorMessage: record.errorMessage ?? null,
        chunkCount: record.chunkCount,
        processedAt: record.processedAt,
      },
    })
  }
}
