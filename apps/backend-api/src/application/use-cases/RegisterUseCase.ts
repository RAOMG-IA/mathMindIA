import { SEED_RATING_BY_LEVEL } from '@mathmind/shared-domain'
import { isValidPassword, MIN_PASSWORD_LENGTH } from '@mathmind/shared-utils'
import type {
  AcademicLevel,
  Clock,
  IdGenerator,
  PasswordHasher,
  TokenIssuer,
  User,
  UserCredentialsRepository,
  UserId,
  UserRepository,
} from '@mathmind/shared-domain'

// Ver docs/use-cases/UC-009-register.md, docs/ADR/ADR-004_domain.md y ADR-005 (semilla de
// rating por AcademicLevel). Las credenciales se persisten separadas de User (ver
// UserCredentials.ts) -- decision ya fijada en ADR-004.
export interface RegisterInput {
  readonly email: string
  readonly password: string
  readonly academicLevel: AcademicLevel
}

export interface RegisterOutput {
  readonly userId: UserId
  readonly sessionToken: string
}

export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly credentials: UserCredentialsRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    // Hallazgo Security 2026-08-07: US-001/ADR-012 dejaban la politica de contrasena "a definir
    // al implementar" -- sin este minimo, se aceptaba cualquier longitud. Regla real en
    // @mathmind/shared-utils (OWASP ASVS L1), unica fuente de verdad compartida con mobile-app.
    if (!isValidPassword(input.password)) {
      throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    }

    const existing = await this.users.findByEmail(input.email)
    if (existing) {
      throw new Error(`Email already registered: ${input.email}`)
    }

    const passwordHash = await this.passwordHasher.hash(input.password)

    const user: User = {
      id: this.ids.generate() as UserId,
      email: input.email,
      academicLevel: input.academicLevel,
      ratings: new Map([[input.academicLevel, SEED_RATING_BY_LEVEL[input.academicLevel]]]),
      currentStreak: 0,
      score: { points: 0 },
      createdAt: this.clock.now(),
    }
    await this.users.save(user)
    await this.credentials.save({ userId: user.id, passwordHash })

    const sessionToken = await this.tokenIssuer.issue(user.id)

    return { userId: user.id, sessionToken }
  }
}
