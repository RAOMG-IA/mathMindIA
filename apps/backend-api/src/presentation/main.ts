import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { InMemoryHintUsageTracker, InMemoryTemaRepository } from '@mathmind/shared-testing'
import { LangChainChatModel, QwenClient } from '@mathmind/ai-engine'
import type { ExerciseId } from '@mathmind/shared-domain'
import { createRoutes } from './http/routes.js'
import { isOriginAllowed, parseAllowedOrigins } from './http/corsConfig.js'
import { AuthController } from './http/AuthController.js'
import { SessionController } from './http/SessionController.js'
import { AnswerController } from './http/AnswerController.js'
import { HintController } from './http/HintController.js'
import { StatisticsController } from './http/StatisticsController.js'
import { TemaController } from './http/TemaController.js'
import { BcryptPasswordHasher } from '../infrastructure/auth/BcryptPasswordHasher.js'
import { JwtTokenIssuer } from '../infrastructure/auth/JwtTokenIssuer.js'
import { QwenHintGenerator } from '../infrastructure/ai/QwenHintGenerator.js'
import { createPrismaClient } from '../infrastructure/persistence/prismaClient.js'
import { PrismaUserRepository } from '../infrastructure/repositories/PrismaUserRepository.js'
import { PrismaUserCredentialsRepository } from '../infrastructure/repositories/PrismaUserCredentialsRepository.js'
import { PrismaSessionRepository } from '../infrastructure/repositories/PrismaSessionRepository.js'
import { PrismaExerciseRepository } from '../infrastructure/repositories/PrismaExerciseRepository.js'
import { PrismaAnswerRepository } from '../infrastructure/repositories/PrismaAnswerRepository.js'
import { PrismaHintRepository } from '../infrastructure/repositories/PrismaHintRepository.js'
import { PostgresKnowledgeBaseIndex } from '../infrastructure/rag/PostgresKnowledgeBaseIndex.js'
import { XenovaEmbedder } from '../infrastructure/rag/XenovaEmbedder.js'
import { RegisterUseCase } from '../application/use-cases/RegisterUseCase.js'
import { LoginUseCase } from '../application/use-cases/LoginUseCase.js'
import { StartSessionUseCase } from '../application/use-cases/StartSessionUseCase.js'
import { EndSessionUseCase } from '../application/use-cases/EndSessionUseCase.js'
import { ValidateAnswerUseCase } from '../application/use-cases/ValidateAnswerUseCase.js'
import { UpdateDifficultyUseCase } from '../application/use-cases/UpdateDifficultyUseCase.js'
import { GenerateHintUseCase } from '../application/use-cases/GenerateHintUseCase.js'
import { GetUserStatisticsUseCase } from '../application/use-cases/GetUserStatisticsUseCase.js'
import { SelectNextExerciseUseCase } from '../application/use-cases/SelectNextExerciseUseCase.js'
import { ListTemasUseCase } from '../application/use-cases/ListTemasUseCase.js'
import { TEMA_CATALOG } from '../infrastructure/seed/temaCatalog.js'

// Composicion (wiring puro, sin logica propia -- ver routes.ts). Repositorios reales sobre
// Postgres (Prisma) para User/Session/Answer/Hint/Exercise/UserCredentials -- ver
// docs/ADR/ADR-013_modelo_datos_fisico.md. TemaRepository se queda en memoria (catalogo de
// ADR-006 sin materializar como tabla, fuera de alcance de ese ADR).
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required (see .env.example)')
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required (see .env.example)')
}

// Allowlist explicita de origenes externos (CORS_ALLOWED_ORIGINS) -- sin ella, ningun origin de
// navegador pasa (isOriginAllowed rechaza por defecto, ver corsConfig.ts). No afecta a clientes
// sin cabecera Origin (apps nativas iOS/Android, curl, servidor a servidor).
const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS)
if (ALLOWED_ORIGINS.length === 0) {
  console.warn('CORS_ALLOWED_ORIGINS is not set -- no browser origin will be allowed (see .env.example)')
}

// Nombres de variable deliberadamente genericos (no "QWEN_*") -- LangChainChatModel envuelve
// ChatOpenAI (LangChain) contra cualquier endpoint compatible con la API de OpenAI, verificado
// en la practica con mas de un proveedor. AI_MODEL_NAME es opcional -- sin valor, se usa el
// default del constructor ('qwen-plus', historico, ver LangChainChatModel.ts).
const AI_API_KEY = process.env.AI_API_KEY
const AI_BASE_URL = process.env.AI_BASE_URL
const AI_MODEL_NAME = process.env.AI_MODEL_NAME

const prisma = createPrismaClient(DATABASE_URL)
const users = new PrismaUserRepository(prisma)
const credentials = new PrismaUserCredentialsRepository(prisma)
const sessions = new PrismaSessionRepository(prisma)
const exercises = new PrismaExerciseRepository(prisma)
const answers = new PrismaAnswerRepository(prisma)
const hints = new PrismaHintRepository(prisma)
const hintUsage = new InMemoryHintUsageTracker()

// Catalogo real de ADR-006 (23 Temas, ver infrastructure/seed/temaCatalog.ts) -- sustituye al
// seed minimo de 1 Tema que vivia aqui antes (ADR-006 adenda 2026-08-10, GET /temas). El Tema
// sigue en memoria (ver comentario de arriba); el Exercise si es persistido de verdad -- se
// espera (await, no fire-and-forget) porque ahora es una escritura real a red/DB, no una Map
// sincrona (hallazgo de Reviewer sobre el `void` original, ver STATUS.md).
const temas = new InMemoryTemaRepository(TEMA_CATALOG)
// Id fijo (no crypto.randomUUID()): save() es upsert, un id estable hace que reiniciar el
// servidor actualice esta misma fila en vez de acumular un Exercise duplicado en cada arranque
// (hueco detectado al conectar este seed a persistencia real -- con InMemory no importaba,
// se perdia entero al reiniciar).
const SEED_EXERCISE_ID = '00000000-0000-0000-0000-000000000001' as ExerciseId
await exercises.save({
  id: SEED_EXERCISE_ID,
  type: 'Resolution',
  academicLevel: 'Primaria',
  topic: 'arit.suma-resta',
  statement: '15 + 27',
  correctAnswer: '42',
  difficulty: { value: 625 },
  timer: { limitMs: 15000 },
  explanation: '15 + 27 = 42',
  generatedBy: 'manual',
})

const idGenerator = { generate: () => crypto.randomUUID() }
const clock = { now: () => new Date() }
const passwordHasher = new BcryptPasswordHasher()
const tokenIssuer = new JwtTokenIssuer(JWT_SECRET)

// UC-011/ADR-014: retrieval real de la base de conocimiento (pgvector). Si no hay material
// consolidado para un Tema/Exercise, search() devuelve [] y la generacion sigue igual que
// hoy -- comportamiento aditivo, no bloqueante (US-008).
const knowledgeBase = new PostgresKnowledgeBaseIndex(prisma, new XenovaEmbedder())

const chatModel =
  AI_API_KEY && AI_BASE_URL
    ? AI_MODEL_NAME
      ? new LangChainChatModel(AI_API_KEY, AI_BASE_URL, AI_MODEL_NAME)
      : new LangChainChatModel(AI_API_KEY, AI_BASE_URL)
    : undefined

const hintGenerator = chatModel
  ? new QwenHintGenerator(new QwenClient(chatModel), knowledgeBase)
  : undefined
if (!hintGenerator) {
  console.warn('AI_API_KEY/AI_BASE_URL not set -- POST /hints will fail until configured.')
}

const updateDifficultyUseCase = new UpdateDifficultyUseCase(exercises)
const selectNextExerciseUseCase = new SelectNextExerciseUseCase(exercises, users)

const controllers = {
  auth: new AuthController(
    new RegisterUseCase(users, credentials, passwordHasher, tokenIssuer, idGenerator, clock),
    new LoginUseCase(users, credentials, passwordHasher, tokenIssuer),
  ),
  session: new SessionController(
    new StartSessionUseCase(temas, sessions, users, selectNextExerciseUseCase, idGenerator, clock),
    new EndSessionUseCase(sessions, answers, users, clock),
  ),
  answer: new AnswerController(
    new ValidateAnswerUseCase(
      sessions,
      exercises,
      answers,
      users,
      updateDifficultyUseCase,
      idGenerator,
      clock,
    ),
    selectNextExerciseUseCase,
    hintUsage,
    sessions,
  ),
  hint: new HintController(
    new GenerateHintUseCase(
      sessions,
      exercises,
      hints,
      hintUsage,
      hintGenerator ?? {
        generate: () => {
          throw new Error('HintGenerator not configured (missing AI_API_KEY/AI_BASE_URL)')
        },
      },
      idGenerator,
    ),
  ),
  statistics: new StatisticsController(new GetUserStatisticsUseCase(users, answers, exercises, temas)),
  tema: new TemaController(new ListTemasUseCase(temas)),
}

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin, ALLOWED_ORIGINS))
    },
  }),
)
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(createRoutes(controllers, tokenIssuer))

app.listen(PORT, () => {
  console.log(`backend-api listening on port ${PORT}`)
})
