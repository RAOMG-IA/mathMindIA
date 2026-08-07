// Trazabilidad: UC-010 (docs/use-cases/UC-010-login.md), US-002
// (docs/user-stories/US-002-login.md) + ADR-012 (mensaje de error generico, sin indicar cual
// de los dos datos fallo -- se verifica aqui comparando el mensaje textual de ambos casos).
//
// TDD Red: LoginUseCase todavia no tiene implementacion (declare class, sin cuerpo). Se espera
// que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FakePasswordHasher,
  FakeTokenIssuer,
  InMemoryUserCredentialsRepository,
  InMemoryUserRepository,
} from '@mathmind/shared-testing'
import type { User, UserId } from '@mathmind/shared-domain'
import { LoginUseCase } from './LoginUseCase.js'

function aUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1' as UserId,
    email: 'user@example.com',
    academicLevel: 'Secundaria',
    ratings: new Map(),
    currentStreak: 0,
    score: { points: 0 },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('LoginUseCase (UC-010)', () => {
  let users: InMemoryUserRepository
  let credentials: InMemoryUserCredentialsRepository
  let passwordHasher: FakePasswordHasher
  let useCase: LoginUseCase

  beforeEach(async () => {
    users = new InMemoryUserRepository()
    credentials = new InMemoryUserCredentialsRepository()
    passwordHasher = new FakePasswordHasher()
    useCase = new LoginUseCase(users, credentials, passwordHasher, new FakeTokenIssuer())

    await users.save(aUser())
    await credentials.save({ userId: 'user-1' as UserId, passwordHash: await passwordHasher.hash('correcta') })
  })

  it('login exitoso: devuelve userId + sessionToken', async () => {
    const result = await useCase.execute({ email: 'user@example.com', password: 'correcta' })

    expect(result.userId).toBe('user-1')
    expect(result.sessionToken).toBe('token-for-user-1')
  })

  it('flujo 1a/2a, email inexistente: lanza con mensaje generico', async () => {
    await expect(useCase.execute({ email: 'no-existe@example.com', password: 'correcta' })).rejects.toThrow(
      'Invalid email or password',
    )
  })

  it('flujo 1a/2a, contrasena incorrecta: lanza con el MISMO mensaje generico que email inexistente', async () => {
    await expect(useCase.execute({ email: 'user@example.com', password: 'incorrecta' })).rejects.toThrow(
      'Invalid email or password',
    )
  })
})
