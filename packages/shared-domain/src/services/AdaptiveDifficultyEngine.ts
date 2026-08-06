import type { Difficulty } from '../value-objects/Difficulty.js'

// Ver docs/ADR/ADR-005-adaptive-difficulty-engine.md. Domain Service puro (sin I/O).
export interface AttemptResult {
  readonly correct: boolean
  readonly responseTimeMs: number
  readonly timeLimitMs: number
}

export interface DifficultyUpdate {
  readonly nextUserRating: Difficulty
  readonly nextExerciseRating: Difficulty
}

export interface AdaptiveDifficultyEngine {
  computeNextDifficulty(
    userRating: Difficulty,
    exerciseRating: Difficulty,
    currentStreak: number,
    attempt: AttemptResult,
  ): DifficultyUpdate
}

// Constantes del algoritmo (ADR-005) -- locales a este servicio, no en
// shared-constants (son parametros de ajuste del algoritmo, no valores
// reutilizados en otros contextos del dominio).
export const K_BASE = 32
export const K_EXERCISE = 8
export const STREAK_CAP = 5
export const STREAK_STEP = 0.1

// PENDIENTE (ver ADR-005, seccion "K provisional / cold start"): K_base=48 durante
// los primeros N_PROVISIONAL=10 ejercicios de un usuario en un nivel requeriria un
// contador de intentos por nivel que hoy no existe en ningun sitio del dominio
// (User.ratings no lo lleva). No se implementa aqui -- ver el ADR para el detalle.

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Formula 1 (ADR-005): resultado esperado segun diferencia de ratings.
function computeExpectedScore(userRating: number, exerciseRating: number): number {
  return 1 / (1 + 10 ** ((exerciseRating - userRating) / 400))
}

// Formula 2 (ADR-005): resultado real con credito parcial por velocidad.
// El clamp asegura S(acierto) siempre en [0.5, 1] y S(fallo) siempre 0.
function computeActualScore(attempt: AttemptResult): number {
  if (!attempt.correct) return 0
  const timeBonus = clamp(
    (attempt.timeLimitMs - attempt.responseTimeMs) / attempt.timeLimitMs,
    0,
    1,
  )
  return 0.5 + 0.5 * timeBonus
}

// Formula 3 (ADR-005): factor K modulado por racha, tope en STREAK_CAP.
// K_base fijo en 32 -- el K provisional (cold start) queda diferido, ver nota arriba.
function computeK(currentStreak: number): number {
  return K_BASE * (1 + Math.min(currentStreak, STREAK_CAP) * STREAK_STEP)
}

// Formulas 4 y 5 (ADR-005): actualizacion simetrica de userRating/exerciseRating.
// Funcion pura, sin I/O -- Domain Service (Clean Architecture, sin dependencias
// de framework). Ver tests: AdaptiveDifficultyEngine.test.ts (US-004, ADR-005).
export function computeNextDifficulty(
  userRating: Difficulty,
  exerciseRating: Difficulty,
  currentStreak: number,
  attempt: AttemptResult,
): DifficultyUpdate {
  const expected = computeExpectedScore(userRating.value, exerciseRating.value)
  const actual = computeActualScore(attempt)
  const delta = actual - expected
  const k = computeK(currentStreak)

  return {
    nextUserRating: { value: userRating.value + k * delta },
    nextExerciseRating: { value: exerciseRating.value - K_EXERCISE * delta },
  }
}
