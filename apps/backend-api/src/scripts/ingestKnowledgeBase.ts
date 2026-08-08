import 'dotenv/config'
import { IngestKnowledgeBaseUseCase } from '@mathmind/ai-engine'
import { createPrismaClient } from '../infrastructure/persistence/prismaClient.js'
import { NodeIngestionFileSystem } from '../infrastructure/rag/NodeIngestionFileSystem.js'
import { XenovaEmbedder } from '../infrastructure/rag/XenovaEmbedder.js'
import { PostgresKnowledgeBaseIndex } from '../infrastructure/rag/PostgresKnowledgeBaseIndex.js'
import { PrismaRagIngestionRepository } from '../infrastructure/repositories/PrismaRagIngestionRepository.js'

// UC-011 (docs/use-cases/UC-011-ingest-knowledge-base.md), ADR-014_rag.md. Disparado
// manualmente (`npm run ingest:rag`) o por cron -- la tarea programada en si (Task Scheduler
// de Windows, systemd timer, etc.) es configuracion del sistema operativo, no de este script;
// RAG_CRON_SCHEDULE (.env.example) documenta el intervalo pretendido sin crearlo aqui.
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required (see .env.example)')
}

const RAG_INPUT_DIR = process.env.RAG_INPUT_DIR
const RAG_HISTORY_DIR = process.env.RAG_HISTORY_DIR
if (!RAG_INPUT_DIR || !RAG_HISTORY_DIR) {
  throw new Error('RAG_INPUT_DIR and RAG_HISTORY_DIR are required (see .env.example)')
}

const prisma = createPrismaClient(DATABASE_URL)
const embedder = new XenovaEmbedder()

const useCase = new IngestKnowledgeBaseUseCase(
  new NodeIngestionFileSystem(RAG_INPUT_DIR, RAG_HISTORY_DIR),
  embedder,
  new PostgresKnowledgeBaseIndex(prisma, embedder),
  new PrismaRagIngestionRepository(prisma),
  { generate: () => crypto.randomUUID() },
  { now: () => new Date() },
)

const result = await useCase.execute()
console.log(`RAG ingestion: ${result.processedCount} processed, ${result.errorCount} errors.`)
await prisma.$disconnect()
