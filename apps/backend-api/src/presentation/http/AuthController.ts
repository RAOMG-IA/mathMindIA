import type {
  GuestLoginResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from '@mathmind/shared-types'
import type { GuestLoginUseCase } from '../../application/use-cases/GuestLoginUseCase.js'
import type { LoginUseCase } from '../../application/use-cases/LoginUseCase.js'
import type { RegisterUseCase } from '../../application/use-cases/RegisterUseCase.js'

// Presentation layer -- traduce DTOs (packages/shared-types) a llamadas de Casos
// de Uso (UC-009 Register, UC-010 Login, US-009 Guest Login). No conoce Express directamente:
// el adaptador HTTP (routes) mapea Request/Response a estos DTOs -- guestLogin es la unica
// excepcion parcial: recibe la IP ya extraida de `req.ip` por routes.ts, como primitivo, no el
// Request completo (mismo criterio de no acoplar este controller a Express).
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly guestLoginUseCase: GuestLoginUseCase,
  ) {}

  async register(request: RegisterRequestDto): Promise<RegisterResponseDto> {
    const result = await this.registerUseCase.execute({
      email: request.email,
      password: request.password,
      academicLevel: request.academicLevel,
    })
    return { userId: result.userId, sessionToken: result.sessionToken }
  }

  async login(request: LoginRequestDto): Promise<LoginResponseDto> {
    const result = await this.loginUseCase.execute({
      email: request.email,
      password: request.password,
    })
    return { userId: result.userId, sessionToken: result.sessionToken }
  }

  async guestLogin(sourceIp: string): Promise<GuestLoginResponseDto> {
    const result = await this.guestLoginUseCase.execute({ sourceIp })
    return { userId: result.userId, sessionToken: result.sessionToken, email: result.email }
  }
}
