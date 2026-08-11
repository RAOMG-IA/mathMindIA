import 'dotenv/config'
import type { AcademicLevel, ExerciseType, Tema } from '@mathmind/shared-domain'
import { GenerateExerciseBatchUseCase, IAClient, LangChainChatModel } from '@mathmind/ai-engine'
import { createPrismaClient } from '../infrastructure/persistence/prismaClient.js'
import { PrismaExerciseRepository } from '../infrastructure/repositories/PrismaExerciseRepository.js'
import { PostgresKnowledgeBaseIndex } from '../infrastructure/rag/PostgresKnowledgeBaseIndex.js'
import { XenovaEmbedder } from '../infrastructure/rag/XenovaEmbedder.js'
import { TEMA_CATALOG } from '../infrastructure/seed/temaCatalog.js'

// UC-001 (docs/use-cases/UC-001-generate-exercise-batch.md) nunca tenia un script que lo
// disparara -- GenerateExerciseBatchUseCase existia y estaba testeado (ai-engine) desde antes,
// pero sin invocador real el Exercise Pool se quedaba en el unico seed manual de main.ts.
// Disparado manualmente (npm run generate:exercises) -- mismo criterio que ingestKnowledgeBase.ts
// (UC-011): el propio UC deja "que Tema/AcademicLevel/type generar" como decision de quien lo
// invoca (paso 1, "seleccionar que tiene escasez en el Pool", queda fuera de la clase).
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required (see .env.example)')
}

const AI_API_KEY = process.env.AI_API_KEY
const AI_BASE_URL = process.env.AI_BASE_URL
if (!AI_API_KEY || !AI_BASE_URL) {
  throw new Error('AI_API_KEY and AI_BASE_URL are required (see .env.example)')
}
const AI_MODEL_NAME = process.env.AI_MODEL_NAME

// Alcance opcional via variables de entorno -- sin ellas, genera para el catalogo COMPLETO
// (todos los Temas x todos sus niveles soportados x Test y Resolution), que son muchas
// llamadas reales al LLM. Filtrar aqui evita quemar cuota sin querer en una prueba rapida.
const temaFilter = process.env.EXERCISE_BATCH_TEMA?.split(',').map((code) => code.trim())
const levelFilter = process.env.EXERCISE_BATCH_LEVEL?.split(',').map((level) => level.trim()) as
  | readonly AcademicLevel[]
  | undefined
const typeFilter = (process.env.EXERCISE_BATCH_TYPE?.split(',').map((type) => type.trim()) as
  | readonly ExerciseType[]
  | undefined) ?? ['Test', 'Resolution']
const countPerCombo = Number(process.env.EXERCISE_BATCH_COUNT ?? 1)

// Ritmo/reintentos ante rate limiting del proveedor -- hueco real detectado al ejecutar contra
// el plan gratuito de Gemini: sin pausa entre llamadas, un lote de mas de ~6 peticiones seguidas
// agota la cuota por minuto y el resto falla con 429 (sin reintento en GenerateExerciseBatchUseCase
// ni en IAClient, ninguno de los dos es responsabilidad de un script CLI operativo). Backoff
// exponencial solo ante 429 -- otros errores (p. ej. invariante violada tras los reintentos
// internos del propio UseCase) no se reintentan aqui, se cuentan como fallo y se sigue.
const CALL_DELAY_MS = Number(process.env.EXERCISE_BATCH_DELAY_MS ?? 3000)
const RATE_LIMIT_MAX_RETRIES = Number(process.env.EXERCISE_BATCH_RATE_LIMIT_RETRIES ?? 5)
const RATE_LIMIT_BASE_DELAY_MS = Number(process.env.EXERCISE_BATCH_RATE_LIMIT_DELAY_MS ?? 10000)

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRateLimitError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status?: unknown }).status === 429
}

const temas = temaFilter ? TEMA_CATALOG.filter((tema) => temaFilter.includes(tema.code)) : TEMA_CATALOG

interface Combo {
  readonly tema: Tema
  readonly level: AcademicLevel
  readonly type: ExerciseType
}

const combos: Combo[] = []
for (const tema of temas) {
  const levels = levelFilter
    ? tema.academicLevels.filter((range) => levelFilter.includes(range.level)).map((range) => range.level)
    : tema.academicLevels.map((range) => range.level)
  for (const level of levels) {
    for (const type of typeFilter) {
      combos.push({ tema, level, type })
    }
  }
}

const prisma = createPrismaClient(DATABASE_URL)
const exercises = new PrismaExerciseRepository(prisma)
const knowledgeBase = new PostgresKnowledgeBaseIndex(prisma, new XenovaEmbedder())
const chatModel = AI_MODEL_NAME
  ? new LangChainChatModel(AI_API_KEY, AI_BASE_URL, AI_MODEL_NAME)
  : new LangChainChatModel(AI_API_KEY, AI_BASE_URL)
const useCase = new GenerateExerciseBatchUseCase(new IAClient(chatModel), exercises, { generate: () => crypto.randomUUID() }, knowledgeBase)

console.log(
  `Generando hasta ${combos.length * countPerCombo} ejercicios (${combos.length} combinaciones Tema x Nivel x Tipo, x${countPerCombo} cada una), ritmo ${CALL_DELAY_MS}ms entre llamadas...`,
)

let generated = 0
let failed = 0
for (const combo of combos) {
  let attempt = 0
  for (;;) {
    try {
      const result = await useCase.execute({
        tema: combo.tema,
        academicLevel: combo.level,
        type: combo.type,
        count: countPerCombo,
      })

      generated += result.exercises.length
      for (const ex of result.exercises) {
        console.log(`OK   ${combo.tema.code} / ${combo.level} / ${combo.type} -> ${ex.id}`)
      }
      if (result.exercises.length < countPerCombo) {
        console.warn(
          `Se generaron ${result.exercises.length}/${countPerCombo} ejercicios para ${combo.tema.code} / ${combo.level} / ${combo.type}`,
        )
      }
      break
    } catch (error) {
      if (isRateLimitError(error) && attempt < RATE_LIMIT_MAX_RETRIES) {
        const delay = RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt
        attempt += 1
        console.warn(
          `429 rate limit en ${combo.tema.code} / ${combo.level} / ${combo.type} -- esperando ${delay}ms (reintento ${attempt}/${RATE_LIMIT_MAX_RETRIES})...`,
        )
        await sleep(delay)
        continue
      }
      failed += 1
      console.error(`FAIL ${combo.tema.code} / ${combo.level} / ${combo.type}:`, error instanceof Error ? error.message : error)
      break
    }
  }
  await sleep(CALL_DELAY_MS)
}

console.log(`Hecho: ${generated} generados, ${failed} fallidos.`)
await prisma.$disconnect()
