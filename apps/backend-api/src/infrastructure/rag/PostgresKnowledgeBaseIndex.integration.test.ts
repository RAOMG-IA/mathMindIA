import { FakeEmbedder } from '@mathmind/shared-testing'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPrismaClient } from '../persistence/prismaClient.js'
import { PostgresKnowledgeBaseIndex } from './PostgresKnowledgeBaseIndex.js'

describe('PostgresKnowledgeBaseIndex (integration)', () => {
  const prisma = createPrismaClient(process.env.DATABASE_URL!)
  const embedder = new FakeEmbedder()
  const index = new PostgresKnowledgeBaseIndex(prisma, embedder)
  const sourceFileNames: string[] = []

  // Aislamiento real (hallazgo de la verificacion DevOps 2026-08-10): el test "array vacio si no
  // hay nada indexado" exige una tabla sin chunks, y en el contenedor Docker se rompe en cuanto
  // existe material ingerido de verdad (rag_chunks con data real del ingest). Se limpia la tabla
  // completa: rag_chunks es un indice derivado/regenerable via `npm run ingest:rag`, no datos de
  // usuario -- eliminar sus filas durante el run de integracion no pierde nada irreemplazable.
  beforeEach(async () => {
    await prisma.$executeRaw`DELETE FROM rag_chunks`
  })

  afterEach(async () => {
    await prisma.$executeRaw`DELETE FROM rag_chunks WHERE source_file_name = ANY(${sourceFileNames})`
    sourceFileNames.length = 0
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // FakeEmbedder es deterministico pero sin semantica real (ver su propio comentario) -- no
  // garantiza que "fracciones" y "denominador" produzcan vectores mas cercanos entre si que con
  // "Paris". Para probar la mecanica real de similitud (orden SQL por distancia coseno, no la
  // calidad semantica del embedding, que depende de XenovaEmbedder real) se busca con el MISMO
  // texto exacto que genero el embedding del chunk relevante -- eso si esta garantizado
  // (mismo embedder, mismo input, mismo vector, distancia 0), independientemente del algoritmo.
  it('index + search: el chunk cuyo embedding coincide con la query aparece primero', async () => {
    const fileName = `test-${crypto.randomUUID()}.txt`
    sourceFileNames.push(fileName)
    const targetQuery = 'fracciones equivalentes denominador'

    await index.index([
      {
        content: 'Las fracciones equivalentes representan la misma cantidad con distinto denominador.',
        embedding: await embedder.embed(targetQuery),
        sourceFileName: fileName,
        chunkIndex: 0,
      },
      {
        content: 'La capital de Francia es Paris.',
        embedding: await embedder.embed('capital de Francia Paris'),
        sourceFileName: fileName,
        chunkIndex: 1,
      },
    ])

    const found = await index.search(targetQuery, 1)

    expect(found).toHaveLength(1)
    expect(found[0]).toContain('fracciones equivalentes')
  })

  it('search: array vacio si no hay nada indexado', async () => {
    const found = await index.search('cualquier cosa', 3)
    expect(found).toEqual([])
  })
})
