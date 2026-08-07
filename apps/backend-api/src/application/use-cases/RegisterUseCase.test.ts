// Trazabilidad: UC-009 (docs/use-cases/UC-009-register.md), US-001
// (docs/user-stories/US-001-registro.md) + ADR-005 (semilla de rating por AcademicLevel,
// Primaria=800 usado aqui deliberadamente en vez de Secundaria=1200 para probar que la semilla
// realmente varia por nivel, no un valor fijo) + ADR-012 (contrasena nunca en texto plano).
//
// TDD Red: RegisterUseCase todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FakePasswordHasher,
  FakeTokenIssuer,
  FixedClock,
  InMemoryUserCredentialsRepository,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from '@mathmind/shared-testing'
import type { UserId } from '@mathmind/shared-domain'
import { RegisterUseCase } from './RegisterUseCase.js'

describe('RegisterUseCase (UC-009)', () => {
  let users: InMemoryUserRepository
  let credentials: InMemoryUserCredentialsRepository
  let useCase: RegisterUseCase
  const now = new Date('2026-08-06T10:00:00Z')

  beforeEach(() => {
    users = new InMemoryUserRepository()
    credentials = new InMemoryUserCredentialsRepository()
    useCase = new RegisterUseCase(
      users,
      credentials,
      new FakePasswordHasher(),
      new FakeTokenIssuer(),
      new SequentialIdGenerator('user'),
      new FixedClock(now),
    )
  })

  it('crea el User con rating sembrado segun el AcademicLevel y devuelve userId + sessionToken', async () => {
    const result = await useCase.execute({
      email: 'nueva@example.com',
      password: 'super-secreta',
      academicLevel: 'Primaria',
    })

    expect(result.userId).toBe('user-1')
    expect(result.sessionToken).toBe('token-for-user-1')

    const user = await users.findById('user-1' as UserId)
    expect(user?.email).toBe('nueva@example.com')
    expect(user?.academicLevel).toBe('Primaria')
    expect(user?.ratings.get('Primaria')).toEqual({ value: 800 })
    expect(user?.currentStreak).toBe(0)
    expect(user?.score).toEqual({ points: 0 })
    expect(user?.createdAt).toEqual(now)
  })

  it('persiste la contrasena hasheada, nunca en texto plano', async () => {
    await useCase.execute({ email: 'nueva@example.com', password: 'super-secreta', academicLevel: 'Primaria' })

    const stored = await credentials.findByUserId('user-1' as UserId)
    expect(stored?.passwordHash).not.toBe('super-secreta')
    expect(stored?.passwordHash).toBe('hashed:super-secreta')
  })

  it('flujo 1a, lanza si el email ya esta registrado', async () => {
    await useCase.execute({ email: 'dup@example.com', password: 'password1', academicLevel: 'Secundaria' })

    await expect(
      useCase.execute({ email: 'dup@example.com', password: 'password2', academicLevel: 'Secundaria' }),
    ).rejects.toThrow()
  })

  it('hallazgo Security 2026-08-07: lanza si la contrasena tiene menos de 8 caracteres', async () => {
    await expect(
      useCase.execute({ email: 'nueva@example.com', password: 'corta1', academicLevel: 'Secundaria' }),
    ).rejects.toThrow()
  })
})
