// Trazabilidad: UC-009/UC-010 (docs/use-cases/UC-009-register.md, UC-010-login.md) + mapa de
// rutas ARCHITECTURE.md ("API REST", POST /auth/register, POST /auth/login). Compone las
// implementaciones reales de RegisterUseCase/LoginUseCase (ya testeadas), no fakes -- mismo
// criterio que ValidateAnswerUseCase+UpdateDifficultyUseCase.
//
// TDD Red: AuthController todavia no tiene implementacion (declare class, sin cuerpo). Se
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
import { AuthController } from './AuthController.js'
import { GuestLoginUseCase } from '../../application/use-cases/GuestLoginUseCase.js'
import { LoginUseCase } from '../../application/use-cases/LoginUseCase.js'
import { RegisterUseCase } from '../../application/use-cases/RegisterUseCase.js'

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(() => {
    const users = new InMemoryUserRepository()
    const credentials = new InMemoryUserCredentialsRepository()
    const passwordHasher = new FakePasswordHasher()
    const tokenIssuer = new FakeTokenIssuer()
    const ids = new SequentialIdGenerator('user')
    const registerUseCase = new RegisterUseCase(
      users,
      credentials,
      passwordHasher,
      tokenIssuer,
      ids,
      new FixedClock(new Date('2026-08-07T00:00:00Z')),
    )
    const loginUseCase = new LoginUseCase(users, credentials, passwordHasher, tokenIssuer)
    const guestLoginUseCase = new GuestLoginUseCase(registerUseCase, ids)
    controller = new AuthController(registerUseCase, loginUseCase, guestLoginUseCase)
  })

  it('register: mapea RegisterRequestDto -> RegisterResponseDto', async () => {
    const result = await controller.register({
      email: 'nueva@example.com',
      password: 'super-secreta',
      academicLevel: 'Primaria',
    })

    expect(result).toEqual({ userId: 'user-1', sessionToken: 'token-for-user-1' })
  })

  it('login: mapea LoginRequestDto -> LoginResponseDto tras un registro previo', async () => {
    await controller.register({ email: 'user@example.com', password: 'correcta', academicLevel: 'Secundaria' })

    const result = await controller.login({ email: 'user@example.com', password: 'correcta' })

    expect(result).toEqual({ userId: 'user-1', sessionToken: 'token-for-user-1' })
  })

  it('login: propaga el rechazo con credenciales incorrectas', async () => {
    await controller.register({ email: 'user@example.com', password: 'correcta', academicLevel: 'Secundaria' })

    await expect(controller.login({ email: 'user@example.com', password: 'incorrecta' })).rejects.toThrow()
  })

  it('guestLogin (US-009): crea una cuenta de invitado y devuelve email + userId + sessionToken', async () => {
    const result = await controller.guestLogin('8.8.8.8')

    expect(result.userId).toBeDefined()
    expect(result.sessionToken).toBeDefined()
    expect(result.email).toMatch(/^publico\d{6}@invitado\.mathmind\.local$/)
  })
})
