import type { AcademicLevel } from '@mathmind/shared-domain'

// UC-007 Get User Statistics (US-007). Sin request DTO: userId viene del contexto
// de autenticacion, no del body (es una consulta de solo lectura sobre "mi" perfil).
export interface TopicStatDto {
  readonly topic: string
  readonly area: string
  readonly accuracy: number // 0..1
  readonly attemptCount: number
}

export interface GetUserStatisticsResponseDto {
  readonly score: number
  readonly rating: number
  readonly academicLevel: AcademicLevel
  // Vacio si el usuario no tiene historial -- ver US-007, escenario "Usuario sin historial".
  readonly byTopic: readonly TopicStatDto[]
}
