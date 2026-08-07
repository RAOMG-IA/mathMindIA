import type { Request, Response, NextFunction } from 'express'
import type { TokenIssuer } from '@mathmind/shared-domain'

// Middleware de autenticacion -- resuelve "Authorization: Bearer <sessionToken>" a un userId
// inyectado en req.userId (ver ARCHITECTURE.md, "API REST": el userId nunca sale del body,
// siempre del token verificado aqui). extractBearerToken es una funcion pura, testeada aparte
// de la logica de middleware que si necesita objetos Request/Response.
export interface AuthenticatedRequest extends Request {
  userId?: string
}

const BEARER_PREFIX = 'Bearer '

export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
    return null
  }
  return authorizationHeader.slice(BEARER_PREFIX.length)
}

export function createAuthMiddleware(tokenIssuer: TokenIssuer) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = extractBearerToken(req.headers.authorization)
    const userId = token ? await tokenIssuer.verify(token) : null

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    req.userId = userId
    next()
  }
}
