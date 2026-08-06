import type { ExercisePublicDto } from './Exercise.js'

// UC-002 Validate Answer (US-004).
export interface SubmitAnswerRequestDto {
  readonly sessionId: string
  readonly exerciseId: string
  readonly submittedValue: string
  readonly responseTimeMs: number
}

// Decision de diseno: se agrupa el resultado (UC-002) y el siguiente ejercicio
// (UC-008) en una sola respuesta para evitar un segundo round-trip -- UC-002 y
// UC-008 siguen siendo casos de uso separados en el backend, esto es composicion
// a nivel de contrato HTTP. nextExercise es opcional para cubrir el caso "pool
// agotado" descrito en UC-008 (flujo alternativo 2b).
export interface SubmitAnswerResponseDto {
  readonly isCorrect: boolean
  readonly explanation: string
  readonly nextExercise?: ExercisePublicDto
}
