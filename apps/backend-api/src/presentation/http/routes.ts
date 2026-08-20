import { Router } from 'express'
import type { Response } from 'express'
import type { AuthController } from './AuthController.js'
import type { SessionController } from './SessionController.js'
import type { AnswerController } from './AnswerController.js'
import type { HintController } from './HintController.js'
import type { StatisticsController } from './StatisticsController.js'
import type { TemaController } from './TemaController.js'
import type { AuthenticatedRequest } from './middleware/authMiddleware.js'
import { createAuthMiddleware } from './middleware/authMiddleware.js'
import { mapUseCaseError } from './errorMapping.js'
import type { TokenIssuer } from '@mathmind/shared-domain'

// Mapeo de rutas -> Controllers, ver ARCHITECTURE.md ("API REST (Rutas)"). Wiring puro (sin
// logica propia mas alla de traducir Request/Response <-> DTO/userId) -- igual que
// LangChainChatModel/Prisma*, queda sin tests automaticos (necesitaria un servidor HTTP real o
// supertest, no incorporado en este alcance); se verifica arrancando el servidor y probando
// los endpoints manualmente. El mapeo de errores en si (mensaje generico vs real) SI esta
// testeado, ver errorMapping.ts/.test.ts (hallazgo Security 2026-08-07).
function handleError(res: Response, error: unknown, exposeMessage: boolean): void {
  const { status, body } = mapUseCaseError(error, exposeMessage)
  res.status(status).json(body)
}

export interface Controllers {
  readonly auth: AuthController
  readonly session: SessionController
  readonly answer: AnswerController
  readonly hint: HintController
  readonly statistics: StatisticsController
  readonly tema: TemaController
}

export function createRoutes(controllers: Controllers, tokenIssuer: TokenIssuer): Router {
  const router = Router()
  const requireAuth = createAuthMiddleware(tokenIssuer)

  router.post('/auth/register', async (req, res) => {
    try {
      res.json(await controllers.auth.register(req.body))
    } catch (error) {
      handleError(res, error, true)
    }
  })

  router.post('/auth/login', async (req, res) => {
    try {
      res.json(await controllers.auth.login(req.body))
    } catch (error) {
      handleError(res, error, true)
    }
  })

  // US-009: sin body -- todos los datos se generan en el servidor. req.ip es la IP que ve
  // Express (el socket directo; sin `trust proxy` configurado, no refleja al cliente real si en
  // el futuro se despliega detras de un reverse proxy/ALB -- no es el caso hoy, deploy directo a
  // EC2, ver ADR-018). Password/username no dependen de conocer al cliente real, solo de tener
  // algun valor -- no es un mecanismo de seguridad (ver GuestLoginUseCase).
  router.post('/auth/guest', async (req, res) => {
    try {
      res.json(await controllers.auth.guestLogin(req.ip ?? '0.0.0.0'))
    } catch (error) {
      handleError(res, error, true)
    }
  })

  router.post('/sessions', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      res.json(await controllers.session.startSession(req.userId as string, req.body))
    } catch (error) {
      handleError(res, error, true)
    }
  })

  // exposeMessage=false: EndSessionUseCase/ValidateAnswerUseCase/GenerateHintUseCase distinguen
  // "sesion inexistente" de "sesion de otro usuario" en el texto del error -- no reenviarlo
  // evita que un atacante confirme la existencia de un sessionId ajeno (hallazgo Security
  // 2026-08-07, ver errorMapping.ts).
  router.post('/sessions/end', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      res.json(await controllers.session.endSession(req.userId as string, req.body))
    } catch (error) {
      handleError(res, error, false)
    }
  })

  router.post('/answers', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      res.json(await controllers.answer.submitAnswer(req.userId as string, req.body))
    } catch (error) {
      handleError(res, error, false)
    }
  })

  router.post('/hints', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      res.json(await controllers.hint.requestHint(req.userId as string, req.body))
    } catch (error) {
      handleError(res, error, false)
    }
  })

  router.get('/users/me/statistics', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      res.json(await controllers.statistics.getStatistics(req.userId as string))
    } catch (error) {
      handleError(res, error, true)
    }
  })

  router.get('/temas', requireAuth, async (_req: AuthenticatedRequest, res) => {
    try {
      res.json(await controllers.tema.listTemas())
    } catch (error) {
      handleError(res, error, true)
    }
  })

  return router
}
