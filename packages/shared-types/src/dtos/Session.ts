import type { AcademicLevel, ExerciseType, TemaCode } from '@mathmind/shared-domain'
import type { ExercisePublicDto } from './Exercise.js'

export interface SessionDto {
  readonly id: string
  readonly mode: ExerciseType
  readonly academicLevel: AcademicLevel
  readonly startedAt: string // ISO 8601
}

// UC-005 Start Session (US-003).
export interface StartSessionRequestDto {
  readonly mode: ExerciseType
  readonly academicLevel: AcademicLevel
  readonly topic: TemaCode
}

export interface StartSessionResponseDto {
  readonly session: SessionDto
  readonly exercise: ExercisePublicDto
}

// UC-006 End Session (US-006).
export interface EndSessionRequestDto {
  readonly sessionId: string
}

export interface EndSessionResponseDto {
  readonly totalAttempts: number
  readonly correctAttempts: number
  readonly avgResponseTimeMs: number
  // Variacion de userRating desde el inicio de la sesion (ADR-005). Puede ser negativa.
  readonly ratingChange: number
}
