// Trazabilidad: hallazgo Security 2026-08-07 (.ai/prompts/security.md) -- fuga de mensajes de
// error que distinguen "sesion inexistente" de "sesion de otro usuario" en las rutas
// protegidas por la verificacion de autorizacion IDOR.
import { describe, expect, it } from 'vitest'
import { mapUseCaseError } from './errorMapping.js'

describe('mapUseCaseError', () => {
  it('exposeMessage=true: reenvia el mensaje real del error con status 400', () => {
    const result = mapUseCaseError(new Error('Email already registered: a@b.com'), true)

    expect(result).toEqual({ status: 400, body: { error: 'Email already registered: a@b.com' } })
  })

  it('exposeMessage=false: colapsa cualquier error a un mensaje generico con status 403', () => {
    const result = mapUseCaseError(new Error('Session X does not belong to user Y'), false)

    expect(result.status).toBe(403)
    expect(result.body.error).not.toContain('does not belong to user')
  })

  it('exposeMessage=false: "sesion inexistente" y "sesion de otro usuario" producen la MISMA respuesta', () => {
    const notFound = mapUseCaseError(new Error('No active session: session-1'), false)
    const wrongOwner = mapUseCaseError(new Error('Session session-1 does not belong to user user-2'), false)

    expect(notFound).toEqual(wrongOwner)
  })

  it('maneja valores lanzados que no son Error', () => {
    const result = mapUseCaseError('algo raro', true)

    expect(result).toEqual({ status: 400, body: { error: 'Unexpected error' } })
  })
})
