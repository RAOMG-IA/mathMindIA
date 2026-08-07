// Trazabilidad: ARCHITECTURE.md ("API REST", "Authorization: Bearer <sessionToken>"
// resuelto por middleware a userId, nunca tomado del body"). Testeado con objetos
// Request/Response minimos (solo los campos que el middleware usa) -- no requiere un
// servidor Express real ni supertest.
//
// TDD Red: extractBearerToken/createAuthMiddleware todavia no tienen implementacion (declare
// function, sin cuerpo). Se espera que este archivo FALLE al ejecutarse hasta que el
// Developer Agent lo implemente.
import { describe, expect, it, vi } from 'vitest'
import type { NextFunction, Response } from 'express'
import { FakeTokenIssuer } from '@mathmind/shared-testing'
import type { UserId } from '@mathmind/shared-domain'
import { createAuthMiddleware, extractBearerToken } from './authMiddleware.js'
import type { AuthenticatedRequest } from './authMiddleware.js'

function aResponse(): Response {
  const res: Partial<Response> = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res as Response
}

describe('extractBearerToken', () => {
  it('extrae el token de un header "Bearer <token>"', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123')
  })

  it('devuelve null si el header no existe', () => {
    expect(extractBearerToken(undefined)).toBeNull()
  })

  it('devuelve null si el header no tiene el prefijo "Bearer "', () => {
    expect(extractBearerToken('abc123')).toBeNull()
  })
})

describe('createAuthMiddleware', () => {
  it('token valido: inyecta userId en req y llama a next()', async () => {
    const tokenIssuer = new FakeTokenIssuer()
    const token = await tokenIssuer.issue('user-1' as UserId)
    const middleware = createAuthMiddleware(tokenIssuer)
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthenticatedRequest
    const res = aResponse()
    const next: NextFunction = vi.fn()

    await middleware(req, res, next)

    expect(req.userId).toBe('user-1')
    expect(next).toHaveBeenCalledOnce()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('sin header Authorization: responde 401 sin llamar a next()', async () => {
    const middleware = createAuthMiddleware(new FakeTokenIssuer())
    const req = { headers: {} } as AuthenticatedRequest
    const res = aResponse()
    const next: NextFunction = vi.fn()

    await middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('token invalido: responde 401 sin llamar a next()', async () => {
    const middleware = createAuthMiddleware(new FakeTokenIssuer())
    const req = { headers: { authorization: 'Bearer token-invalido' } } as AuthenticatedRequest
    const res = aResponse()
    const next: NextFunction = vi.fn()

    await middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})
