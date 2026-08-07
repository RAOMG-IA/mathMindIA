import 'dotenv/config'
import express from 'express'
import {
  InMemoryAnswerRepository,
  InMemoryExerciseRepository,
  InMemoryHintRepository,
  InMemoryHintUsageTracker,
  InMemorySessionRepository,
  InMemoryTemaRepository,
  InMemoryUserCredentialsRepository,
  InMemoryUserRepository,
} from '@mathmind/shared-testing'
import { LangChainQwenModel, QwenClient } from '@mathmind/ai-engine'
import type { ExerciseId } from '@mathmind/shared-domain'
import { createRoutes } from './http/routes.js'
import { AuthController } from './http/AuthController.js'
import { SessionController } from './http/SessionController.js'
import { AnswerController } from './http/AnswerController.js'
import { HintController } from './http/HintController.js'
import { StatisticsController } from './http/StatisticsController.js'
import { BcryptPasswordHasher } from '../infrastructure/auth/BcryptPasswordHasher.js'
import { JwtTokenIssuer } from '../infrastructure/auth/JwtTokenIssuer.js'
import { QwenHintGenerator } from '../infrastructure/ai/QwenHintGenerator.js'
import { RegisterUseCase } from '../application/use-cases/RegisterUseCase.js'
import { LoginUseCase } from '../application/use-cases/LoginUseCase.js'
import { StartSessionUseCase } from '../application/use-cases/StartSessionUseCase.js'
import { EndSessionUseCase } from '../application/use-cases/EndSessionUseCase.js'
import { ValidateAnswerUseCase } from '../application/use-cases/ValidateAnswerUseCase.js'
import { UpdateDifficultyUseCase } from '../application/use-cases/UpdateDifficultyUseCase.js'
import { GenerateHintUseCase } from '../application/use-cases/GenerateHintUseCase.js'
import { GetUserStatisticsUseCase } from '../application/use-cases/GetUserStatisticsUseCase.js'
import { SelectNextExerciseUseCase } from '../application/use-cases/SelectNextExerciseUseCase.js'

// Composicion (wiring puro, sin logica propia -- ver routes.ts). NOTA: usa los repositorios en
// memoria de @mathmind/shared-testing en vez de Prisma*Repository -- estas ultimas siguen
// siendo `declare class` sin cuerpo (Database sigue bloqueada, ver STATUS.md). Esto hace que el
// servidor arranque y sea probable manualmente end-to-end, pero SIN persistencia real entre
// reinicios -- swap a Prisma es el siguiente paso de Infrastructure, no un cambio de esta capa
// de wiring (las Use Cases ya dependen solo de las interfaces de shared-domain).
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required (see .env.example)')
}

const QWEN_API_KEY = process.env.QWEN_API_KEY
const QWEN_BASE_URL = process.env.QWEN_BASE_URL

const users = new InMemoryUserRepository()
const credentials = new InMemoryUserCredentialsRepository()
const sessions = new InMemorySessionRepository()
const exercises = new InMemoryExerciseRepository()
const answers = new InMemoryAnswerRepository()
const hints = new InMemoryHintRepository()
const hintUsage = new InMemoryHintUsageTracker()

// Seed minimo para poder arrancar y probar manualmente (no es el catalogo real de ADR-006 --
// eso requiere la migracion/seed real de Infrastructure, todavia sin hacer). Sin esto,
// POST /sessions falla siempre (ningun Tema existe).
const temas = new InMemoryTemaRepository([
  {
    code: 'arit.suma-resta',
    area: 'arit',
    label: 'Suma y resta',
    description: 'Operaciones basicas de suma y resta mental',
    academicLevels: [{ level: 'Primaria', difficultyRange: { min: 500, max: 750 } }],
  },
])
void exercises.save({
  id: crypto.randomUUID() as ExerciseId,
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

const hintGenerator =
  QWEN_API_KEY && QWEN_BASE_URL
    ? new QwenHintGenerator(new QwenClient(new LangChainQwenModel(QWEN_API_KEY, QWEN_BASE_URL)))
    : undefined
if (!hintGenerator) {
  console.warn('QWEN_API_KEY/QWEN_BASE_URL not set -- POST /hints will fail until configured.')
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
          throw new Error('HintGenerator not configured (missing QWEN_API_KEY/QWEN_BASE_URL)')
        },
      },
      idGenerator,
    ),
  ),
  statistics: new StatisticsController(new GetUserStatisticsUseCase(users, answers, exercises, temas)),
}

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(createRoutes(controllers, tokenIssuer))

app.listen(PORT, () => {
  console.log(`backend-api listening on port ${PORT}`)
})
