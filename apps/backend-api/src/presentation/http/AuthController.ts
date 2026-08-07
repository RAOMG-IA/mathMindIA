import type {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from '@mathmind/shared-types'
import type { LoginUseCase } from '../../application/use-cases/LoginUseCase.js'
import type { RegisterUseCase } from '../../application/use-cases/RegisterUseCase.js'

// Presentation layer -- traduce DTOs (packages/shared-types) a llamadas de Casos
// de Uso (UC-009 Register, UC-010 Login). No conoce Express directamente: el
// adaptador HTTP (routes) mapea Request/Response a estos DTOs.
//
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
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
}
