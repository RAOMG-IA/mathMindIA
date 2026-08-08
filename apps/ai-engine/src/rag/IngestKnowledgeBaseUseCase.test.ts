// Trazabilidad: UC-011 (docs/use-cases/UC-011-ingest-knowledge-base.md) + ADR-014
// (docs/ADR/ADR-014_rag.md).
//
// TDD Red: IngestKnowledgeBaseUseCase todavia no tiene implementacion (declare class, sin
// cuerpo). Se espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la
// implemente.
import { describe, expect, it } from 'vitest'
import {
  FakeEmbedder,
  FixedClock,
  InMemoryIngestionFileSystem,
  InMemoryKnowledgeBaseIndex,
  InMemoryRagIngestionRepository,
  SequentialIdGenerator,
} from '@mathmind/shared-testing'
import { IngestKnowledgeBaseUseCase } from './IngestKnowledgeBaseUseCase.js'

function aUseCase(seed: Readonly<Record<string, string>>) {
  const fileSystem = new InMemoryIngestionFileSystem(seed)
  const index = new InMemoryKnowledgeBaseIndex()
  const ingestionRepository = new InMemoryRagIngestionRepository()
  const useCase = new IngestKnowledgeBaseUseCase(
    fileSystem,
    new FakeEmbedder(),
    index,
    ingestionRepository,
    new SequentialIdGenerator('rag'),
    new FixedClock(new Date('2026-08-08T00:00:00.000Z')),
  )
  return { useCase, fileSystem, index, ingestionRepository }
}

describe('IngestKnowledgeBaseUseCase (UC-011)', () => {
  it('ingesta un fichero .txt: lo divide en chunks, los indexa, registra Processed y lo mueve al historico', async () => {
    const longText = 'Ejercicio de fracciones equivalentes. '.repeat(50)
    const { useCase, fileSystem, index, ingestionRepository } = aUseCase({ 'fracciones.txt': longText })

    const result = await useCase.execute()

    expect(result).toEqual({ processedCount: 1, errorCount: 0 })
    expect(await fileSystem.listInputFiles()).toEqual([])
    expect(fileSystem.historyFiles).toEqual(['fracciones.txt'])
    expect(ingestionRepository.records).toHaveLength(1)
    expect(ingestionRepository.records[0]).toMatchObject({ fileName: 'fracciones.txt', status: 'Processed' })
    expect(ingestionRepository.records[0]!.chunkCount).toBeGreaterThan(0)

    const found = await index.search('fracciones equivalentes', 3)
    expect(found.length).toBeGreaterThan(0)
  })

  it('ingesta un fichero .md igual que un .txt', async () => {
    const { useCase, ingestionRepository } = aUseCase({ 'notas.md': '# Notas\n\nAlgo de contenido.' })

    await useCase.execute()

    expect(ingestionRepository.records[0]).toMatchObject({ fileName: 'notas.md', status: 'Processed' })
  })

  it('flujo 2a: fichero de formato no soportado se registra como Error y se mueve igualmente al historico', async () => {
    const { useCase, fileSystem, index, ingestionRepository } = aUseCase({ 'banco.pdf': 'contenido binario simulado' })

    const result = await useCase.execute()

    expect(result).toEqual({ processedCount: 0, errorCount: 1 })
    expect(fileSystem.historyFiles).toEqual(['banco.pdf'])
    expect(ingestionRepository.records[0]!.status).toBe('Error')
    expect(ingestionRepository.records[0]!.errorMessage).toBeTruthy()
    expect(await index.search('contenido', 3)).toEqual([])
  })

  it('un fichero con error no bloquea el procesado del resto', async () => {
    const { useCase, ingestionRepository } = aUseCase({
      'malo.pdf': 'no soportado',
      'bueno.txt': 'Contenido valido de sobra para generar al menos un chunk.',
    })

    const result = await useCase.execute()

    expect(result).toEqual({ processedCount: 1, errorCount: 1 })
    const statuses = ingestionRepository.records.map((record) => record.status).sort()
    expect(statuses).toEqual(['Error', 'Processed'])
  })

  it('directorio de entrada vacio: no genera ningun registro ni error', async () => {
    const { useCase, ingestionRepository } = aUseCase({})

    const result = await useCase.execute()

    expect(result).toEqual({ processedCount: 0, errorCount: 0 })
    expect(ingestionRepository.records).toHaveLength(0)
  })
})
