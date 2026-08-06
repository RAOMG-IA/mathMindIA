import type { GetUserStatisticsResponseDto } from '@mathmind/shared-types'

// Presentation layer -- UC-007 Get User Statistics. Sin request DTO: userId
// viene del contexto de autenticacion (middleware), no del body -- ver
// packages/shared-types/src/dtos/Statistics.ts.
// Sin cuerpo todavia -- pendiente de Tests (ADR-003) y de los Casos de Uso.
export declare class StatisticsController {
  getStatistics(userId: string): Promise<GetUserStatisticsResponseDto>
}
