import { SEED_RATING_BY_LEVEL } from '@mathmind/shared-domain'
import type { UserId } from '@mathmind/shared-domain'
import type { GetUserStatisticsResponseDto } from '@mathmind/shared-types'
import type { GetUserStatisticsUseCase } from '../../application/use-cases/GetUserStatisticsUseCase.js'

// Presentation layer -- UC-007 Get User Statistics. Sin request DTO: userId
// viene del contexto de autenticacion (middleware), no del body.
// GetUserStatisticsResponseDto.rating es un unico numero para el academicLevel actual del
// usuario (no el mapa completo de ratings por nivel que devuelve el Caso de Uso) -- si el
// usuario no tiene rating registrado todavia para su nivel actual, usa la semilla
// (SEED_RATING_BY_LEVEL, mismo fallback que el resto de Casos de Uso).
//
export class StatisticsController {
  constructor(private readonly getUserStatisticsUseCase: GetUserStatisticsUseCase) {}

  async getStatistics(userId: string): Promise<GetUserStatisticsResponseDto> {
    const result = await this.getUserStatisticsUseCase.execute({ userId: userId as UserId })
    const rating =
      result.ratings.get(result.academicLevel) ?? SEED_RATING_BY_LEVEL[result.academicLevel]

    return {
      score: result.score.points,
      rating: rating.value,
      academicLevel: result.academicLevel,
      byTopic: result.topics.map((topic) => ({
        topic: topic.topic,
        area: topic.area,
        accuracy: topic.accuracy,
        attemptCount: topic.attempts,
      })),
    }
  }
}
