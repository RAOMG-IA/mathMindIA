// Trazabilidad: US-009 (docs/user-stories/US-009-acceso-invitado.md). Reutiliza RegisterUseCase
// tal cual -- misma logica de negocio, mismas invariantes (ADR-004/ADR-005/ADR-012) -- en vez de
// duplicar altas de usuario. Ver "Contexto de dominio" de la propia historia para el porque de
// cada dato generado (email sintetico, password derivada de la IP, nivel fijo).
//
// TDD Red: GuestLoginUseCase todavia no tiene implementacion. Se espera que este archivo FALLE
// al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FakePasswordHasher,
  FakeTokenIssuer,
  FixedClock,
  InMemoryUserCredentialsRepository,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from '@mathmind/shared-testing'
import type { User, UserId } from '@mathmind/shared-domain'
import { RegisterUseCase } from './RegisterUseCase.js'
import { deriveGuestNumber, GuestLoginUseCase } from './GuestLoginUseCase.js'

function blockerUser(email: string, id: string): User {
  return {
    id: id as UserId,
    email,
    academicLevel: 'Secundaria',
    ratings: new Map(),
    currentStreak: 0,
    score: { points: 0 },
    createdAt: new Date('2026-08-20T00:00:00Z'),
  }
}

describe('deriveGuestNumber', () => {
  it('es determinista para el mismo id', () => {
    expect(deriveGuestNumber('guest-1')).toBe(deriveGuestNumber('guest-1'))
  })

  it('produce numeros distintos para ids distintos (con alta probabilidad)', () => {
    expect(deriveGuestNumber('guest-1')).not.toBe(deriveGuestNumber('guest-2'))
  })

  it('siempre devuelve 6 digitos, cualquiera que sea el formato del id de entrada', () => {
    expect(deriveGuestNumber('x')).toMatch(/^\d{6}$/)
    expect(deriveGuestNumber('3fa85f64-5717-4562-b3fc-2c963f66afa6')).toMatch(/^\d{6}$/)
  })
})

describe('GuestLoginUseCase (US-009)', () => {
  let users: InMemoryUserRepository
  let credentials: InMemoryUserCredentialsRepository
  let ids: SequentialIdGenerator
  let useCase: GuestLoginUseCase

  beforeEach(() => {
    users = new InMemoryUserRepository()
    credentials = new InMemoryUserCredentialsRepository()
    ids = new SequentialIdGenerator('guest')
    const registerUseCase = new RegisterUseCase(
      users,
      credentials,
      new FakePasswordHasher(),
      new FakeTokenIssuer(),
      ids,
      new FixedClock(new Date('2026-08-20T00:00:00Z')),
    )
    useCase = new GuestLoginUseCase(registerUseCase, ids)
  })

  it('crea una cuenta Publico<numero> con nivel Secundaria y devuelve email + userId + sessionToken', async () => {
    const result = await useCase.execute({ sourceIp: '8.8.8.8' })

    expect(result.userId).toBeDefined()
    expect(result.sessionToken).toBeDefined()
    expect(result.email).toMatch(/^publico\d{6}@invitado\.mathmind\.local$/)

    const user = await users.findById(result.userId as UserId)
    expect(user?.academicLevel).toBe('Secundaria')
    expect(user?.ratings.get('Secundaria')).toBeDefined()
  })

  it('el password deriva de la IP y cumple la longitud minima incluso para IPs cortas', async () => {
    const result = await useCase.execute({ sourceIp: '::1' })

    const stored = await credentials.findByUserId(result.userId as UserId)
    // FakePasswordHasher: passwordHash = `hashed:${password}` -- deja ver el password real.
    expect(stored?.passwordHash).toContain('::1')
    expect(stored?.passwordHash.replace('hashed:', '').length).toBeGreaterThanOrEqual(8)
  })

  it('dos invitados con la misma IP obtienen cuentas y sesiones distintas', async () => {
    const first = await useCase.execute({ sourceIp: '1.2.3.4' })
    const second = await useCase.execute({ sourceIp: '1.2.3.4' })

    expect(first.email).not.toBe(second.email)
    expect(first.userId).not.toBe(second.userId)
    expect(first.sessionToken).not.toBe(second.sessionToken)
  })

  it('reintenta con un numero nuevo si el email generado ya existe, sin fallar', async () => {
    // El primer intento de GuestLoginUseCase consume el primer id de la secuencia ('guest-1')
    // para derivar el sufijo -- se provoca la colision registrando esa cuenta de antemano.
    const collidingSuffix = deriveGuestNumber('guest-1')
    const collidingEmail = `publico${collidingSuffix}@invitado.mathmind.local`
    await users.save(blockerUser(collidingEmail, 'blocker'))

    const result = await useCase.execute({ sourceIp: '9.9.9.9' })

    expect(result.email).not.toBe(collidingEmail)
  })

  it('lanza si se agotan los reintentos ante colisiones repetidas', async () => {
    // Cada intento fallido consume exactamente un id de la secuencia (RegisterUseCase lanza por
    // email duplicado antes de generar el id real del User) -- bloquea los 5 primeros.
    for (let i = 1; i <= 5; i++) {
      const suffix = deriveGuestNumber(`guest-${i}`)
      await users.save(blockerUser(`publico${suffix}@invitado.mathmind.local`, `blocker-${i}`))
    }

    await expect(useCase.execute({ sourceIp: '1.1.1.1' })).rejects.toThrow()
  })
})
