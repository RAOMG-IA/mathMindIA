import type {
  AcademicLevel,
  AnswerRepository,
  Difficulty,
  Exercise,
  ExerciseId,
  ExerciseRepository,
  Score,
  TemaCode,
  UserId,
  UserRepository,
} from '@mathmind/shared-domain'

// Ver docs/use-cases/UC-007-get-user-statistics.md y docs/ADR/ADR-006_math_topics.md
// (agregacion por Tema ya prevista como uno de los propositos de la taxonomia).
// MIN_ATTEMPTS_PER_TOPIC y TOP_N son umbrales que el UC deja explicitamente
// "a definir al implementar" (ver su seccion "Fuera de alcance").
const MIN_ATTEMPTS_PER_TOPIC = 3
const TOP_N = 3

export interface GetUserStatisticsInput {
  readonly userId: UserId
}

export interface TopicStats {
  readonly topic: TemaCode
  readonly attempts: number
  readonly correctAttempts: number
  readonly accuracy: number
  readonly avgResponseTimeMs: number
}

export interface GetUserStatisticsOutput {
  readonly score: Score
  readonly ratings: ReadonlyMap<AcademicLevel, Difficulty>
  readonly topics: readonly TopicStats[]
  readonly strengths: readonly TopicStats[]
  readonly weaknesses: readonly TopicStats[]
}

interface TopicAccumulator {
  attempts: number
  correct: number
  totalResponseTimeMs: number
}

export class GetUserStatisticsUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly answers: AnswerRepository,
    private readonly exercises: ExerciseRepository,
  ) {}

  async execute(input: GetUserStatisticsInput): Promise<GetUserStatisticsOutput> {
    const user = await this.users.findById(input.userId)
    if (!user) {
      throw new Error(`User not found: ${input.userId}`)
    }

    const userAnswers = await this.answers.findByUserId(input.userId)
    const exerciseById = new Map<ExerciseId, Exercise | null>()
    const byTopic = new Map<TemaCode, TopicAccumulator>()

    for (const answer of userAnswers) {
      let exercise = exerciseById.get(answer.exerciseId)
      if (exercise === undefined) {
        exercise = await this.exercises.findById(answer.exerciseId)
        exerciseById.set(answer.exerciseId, exercise)
      }
      if (!exercise) continue

      const bucket = byTopic.get(exercise.topic) ?? { attempts: 0, correct: 0, totalResponseTimeMs: 0 }
      bucket.attempts += 1
      if (answer.isCorrect) bucket.correct += 1
      bucket.totalResponseTimeMs += answer.responseTimeMs
      byTopic.set(exercise.topic, bucket)
    }

    const topics: TopicStats[] = [...byTopic.entries()].map(([topic, bucket]) => ({
      topic,
      attempts: bucket.attempts,
      correctAttempts: bucket.correct,
      accuracy: bucket.correct / bucket.attempts,
      avgResponseTimeMs: bucket.totalResponseTimeMs / bucket.attempts,
    }))

    const eligible = topics.filter((topic) => topic.attempts >= MIN_ATTEMPTS_PER_TOPIC)
    const strengths = [...eligible].sort((a, b) => b.accuracy - a.accuracy).slice(0, TOP_N)
    const weaknesses = [...eligible].sort((a, b) => a.accuracy - b.accuracy).slice(0, TOP_N)

    return { score: user.score, ratings: user.ratings, topics, strengths, weaknesses }
  }
}
