import type { RagIngestionRecord, RagIngestionRecordId } from '@mathmind/shared-domain'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { createPrismaClient } from '../persistence/prismaClient.js'
import { PrismaRagIngestionRepository } from './PrismaRagIngestionRepository.js'

describe('PrismaRagIngestionRepository (integration)', () => {
  const prisma = createPrismaClient(process.env.DATABASE_URL!)
  const repository = new PrismaRagIngestionRepository(prisma)
  const createdIds: RagIngestionRecordId[] = []

  function trackRecord(id: RagIngestionRecordId): RagIngestionRecordId {
    createdIds.push(id)
    return id
  }

  afterEach(async () => {
    await prisma.ragIngestionRecord.deleteMany({ where: { id: { in: createdIds } } })
    createdIds.length = 0
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  function aRecord(overrides: Partial<RagIngestionRecord> = {}): RagIngestionRecord {
    return {
      id: trackRecord(crypto.randomUUID() as RagIngestionRecordId),
      fileName: 'notas.txt',
      status: 'Processed',
      chunkCount: 3,
      processedAt: new Date('2026-08-08T00:00:00.000Z'),
      ...overrides,
    }
  }

  it('save + lectura directa: round-trip de un registro Processed', async () => {
    const record = aRecord()
    await repository.save(record)

    const row = await prisma.ragIngestionRecord.findUniqueOrThrow({ where: { id: record.id } })
    expect(row.fileName).toBe('notas.txt')
    expect(row.status).toBe('Processed')
    expect(row.chunkCount).toBe(3)
    expect(row.errorMessage).toBeNull()
  })

  it('save: persiste errorMessage para un registro Error', async () => {
    const record = aRecord({ status: 'Error', chunkCount: 0, errorMessage: 'Unsupported file format: banco.pdf' })
    await repository.save(record)

    const row = await prisma.ragIngestionRecord.findUniqueOrThrow({ where: { id: record.id } })
    expect(row.status).toBe('Error')
    expect(row.errorMessage).toBe('Unsupported file format: banco.pdf')
  })
})
