import type {
  PasswordHasher,
  TokenIssuer,
  UserCredentialsRepository,
  UserId,
  UserRepository,
} from '@mathmind/shared-domain'

// Ver docs/use-cases/UC-010-login.md y docs/ADR/ADR-012_linea_base_seguridad.md.
// Mensaje de error UNICO para email inexistente y contrasena incorrecta -- evita que un
// atacante deduzca que emails estan registrados (US-002, ADR-012).
export interface LoginInput {
  readonly email: string
  readonly password: string
}

export interface LoginOutput {
  readonly userId: UserId
  readonly sessionToken: string
}

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password'

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly credentials: UserCredentialsRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.users.findByEmail(input.email)
    if (!user) {
      throw new Error(INVALID_CREDENTIALS_MESSAGE)
    }

    const storedCredentials = await this.credentials.findByUserId(user.id)
    if (!storedCredentials) {
      throw new Error(INVALID_CREDENTIALS_MESSAGE)
    }

    const isValidPassword = await this.passwordHasher.verify(input.password, storedCredentials.passwordHash)
    if (!isValidPassword) {
      throw new Error(INVALID_CREDENTIALS_MESSAGE)
    }

    const sessionToken = await this.tokenIssuer.issue(user.id)

    return { userId: user.id, sessionToken }
  }
}
