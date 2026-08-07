// Trazabilidad: ADR-012 (docs/ADR/ADR-012_linea_base_seguridad.md, "futuras claves de firma
// JWT"). Sin fakes: jsonwebtoken es computo puro, se testea con la libreria real.
//
// TDD Red: JwtTokenIssuer todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { describe, expect, it } from 'vitest'
import jwt from 'jsonwebtoken'
import type { UserId } from '@mathmind/shared-domain'
import { JwtTokenIssuer } from './JwtTokenIssuer.js'

describe('JwtTokenIssuer', () => {
  it('issue() + verify() recupera el mismo userId (roundtrip)', async () => {
    const issuer = new JwtTokenIssuer('secreto-de-test')

    const token = await issuer.issue('user-1' as UserId)
    const result = await issuer.verify(token)

    expect(result).toBe('user-1')
  })

  it('verify() devuelve null para un token invalido', async () => {
    const issuer = new JwtTokenIssuer('secreto-de-test')

    await expect(issuer.verify('esto-no-es-un-jwt')).resolves.toBeNull()
  })

  it('verify() devuelve null si el token fue firmado con otro secreto', async () => {
    const issuer = new JwtTokenIssuer('secreto-de-test')
    const otroEmisor = new JwtTokenIssuer('otro-secreto')
    const token = await otroEmisor.issue('user-1' as UserId)

    await expect(issuer.verify(token)).resolves.toBeNull()
  })

  it('verify() devuelve null para un token ya expirado', async () => {
    const issuer = new JwtTokenIssuer('secreto-de-test', '-10s')

    const token = await issuer.issue('user-1' as UserId)

    await expect(issuer.verify(token)).resolves.toBeNull()
  })

  it('hallazgo Security 2026-08-07: rechaza un token sin firmar (alg=none)', async () => {
    const issuer = new JwtTokenIssuer('secreto-de-test')
    const unsignedToken = jwt.sign({ sub: 'user-1' }, null, { algorithm: 'none' })

    await expect(issuer.verify(unsignedToken)).resolves.toBeNull()
  })
})
