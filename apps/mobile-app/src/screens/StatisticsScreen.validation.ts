import type { TopicStatDto } from '@mathmind/shared-types'

// Mismo umbral que MIN_ATTEMPTS_PER_TOPIC en GetUserStatisticsUseCase.ts (backend-api) -- no
// expuesto como constante compartida en el DTO, se replica aqui a proposito (US-007, "puede
// identificar en que temas tiene mejor y peor desempeño": con pocos intentos la conclusion no
// es fiable).
export const MIN_ATTEMPTS_FOR_RANKING = 3
const TOP_N = 3

export interface TopicBreakdown {
  readonly strengths: readonly TopicStatDto[]
  readonly weaknesses: readonly TopicStatDto[]
}

// byTopic ya viene plano desde el DTO (score/rating/academicLevel no participan) -- ordena por
// accuracy desc/asc y filtra por intentos minimos, mismo criterio que strengths/weaknesses en
// GetUserStatisticsUseCase, que no se exponen en el DTO publico.
export function deriveTopicBreakdown(byTopic: readonly TopicStatDto[]): TopicBreakdown {
  const eligible = byTopic.filter((topic) => topic.attemptCount >= MIN_ATTEMPTS_FOR_RANKING)
  const strengths = [...eligible].sort((a, b) => b.accuracy - a.accuracy).slice(0, TOP_N)
  const weaknesses = [...eligible].sort((a, b) => a.accuracy - b.accuracy).slice(0, TOP_N)
  return { strengths, weaknesses }
}
