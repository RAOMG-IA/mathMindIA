import type {
  AcademicLevel,
  Clock,
  ExerciseType,
  IdGenerator,
  Session,
  SessionId,
  SessionRepository,
  TemaCode,
  TemaRepository,
  UserId,
  UserRepository,
} from '@mathmind/shared-domain'
import { SEED_RATING_BY_LEVEL } from '@mathmind/shared-domain'
import type { SelectableExercise, SelectNextExerciseUseCase } from './SelectNextExerciseUseCase.js'

// Ver docs/use-cases/UC-005-start-session.md y docs/ADR/ADR-006_math_topics.md (catalogo de
// Temas). Compone SelectNextExerciseUseCase (UC-008, paso 3).
export interface StartSessionInput {
  readonly userId: UserId
  readonly mode: ExerciseType
  readonly academicLevel: AcademicLevel
  readonly topic: TemaCode
}

export interface StartSessionOutput {
  readonly session: Session
  readonly exercise: SelectableExercise
}

export class StartSessionUseCase {
  constructor(
    private readonly temas: TemaRepository,
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
    private readonly selectNextExercise: SelectNextExerciseUseCase,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: StartSessionInput): Promise<StartSessionOutput> {
    const tema = await this.temas.findByCode(input.topic)
    if (!tema) {
      throw new Error(`Tema not found: ${input.topic}`)
    }
    if (!tema.academicLevels.some((range) => range.level === input.academicLevel)) {
      throw new Error(`Tema ${input.topic} does not apply to ${input.academicLevel}`)
    }

    const user = await this.users.findById(input.userId)
    if (!user) {
      throw new Error(`User not found: ${input.userId}`)
    }

    const session: Session = {
      id: this.ids.generate() as SessionId,
      userId: input.userId,
      mode: input.mode,
      academicLevel: input.academicLevel,
      topic: input.topic,
      ratingAtStart: user.ratings.get(input.academicLevel) ?? SEED_RATING_BY_LEVEL[input.academicLevel],
      startedAt: this.clock.now(),
    }
    await this.sessions.save(session)

    const { exercise } = await this.selectNextExercise.execute({
      userId: input.userId,
      academicLevel: input.academicLevel,
      topic: input.topic,
      type: input.mode,
    })

    return { session, exercise }
  }
}
