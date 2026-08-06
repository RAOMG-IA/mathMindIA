// Trazabilidad: US-004 (docs/user-stories/US-004-resolver-ejercicio.md), AC "el
// siguiente ejercicio refleja la nueva dificultad calculada" + ADR-005
// (docs/ADR/ADR-005-adaptive-difficulty-engine.md), fuente de las formulas y de
// los valores esperados calculados a mano abajo.
//
// TDD Red: computeNextDifficulty todavia no tiene implementacion (ver
// AdaptiveDifficultyEngine.ts, "declare function"). Se espera que este archivo
// FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { describe, expect, it } from 'vitest'
import { computeNextDifficulty } from './AdaptiveDifficultyEngine.js'
import type { AttemptResult } from './AdaptiveDifficultyEngine.js'
import type { Difficulty } from '../value-objects/Difficulty.js'

function difficulty(value: number): Difficulty {
  return { value }
}

function attempt(overrides: Partial<AttemptResult>): AttemptResult {
  return { correct: true, responseTimeMs: 0, timeLimitMs: 10000, ...overrides }
}

describe('computeNextDifficulty (ADR-005)', () => {
  it('ratings iguales + acierto instantaneo + streak=0: E=0.5, S=1.0, K=32', () => {
    const result = computeNextDifficulty(
      difficulty(1200),
      difficulty(1200),
      0,
      attempt({ correct: true, responseTimeMs: 0, timeLimitMs: 10000 }),
    )

    expect(result.nextUserRating.value).toBe(1216)
    expect(result.nextExerciseRating.value).toBe(1196)
  })

  it('ratings iguales + acierto justo al limite de tiempo: S=0.5=E, sin cambio', () => {
    const result = computeNextDifficulty(
      difficulty(1200),
      difficulty(1200),
      0,
      attempt({ correct: true, responseTimeMs: 10000, timeLimitMs: 10000 }),
    )

    expect(result.nextUserRating.value).toBe(1200)
    expect(result.nextExerciseRating.value).toBe(1200)
  })

  it('ratings iguales + fallo + streak=0: S=0, el ejercicio "gana"', () => {
    const result = computeNextDifficulty(
      difficulty(1200),
      difficulty(1200),
      0,
      attempt({ correct: false, responseTimeMs: 5000, timeLimitMs: 10000 }),
    )

    expect(result.nextUserRating.value).toBe(1184)
    expect(result.nextExerciseRating.value).toBe(1204)
  })

  it('racha=5 multiplica K de usuario (x1.5) pero NO afecta a K_exercise', () => {
    const result = computeNextDifficulty(
      difficulty(1200),
      difficulty(1200),
      5,
      attempt({ correct: true, responseTimeMs: 0, timeLimitMs: 10000 }),
    )

    // K = 32 * 1.5 = 48 -> mayor salto que el caso streak=0 (+16)
    expect(result.nextUserRating.value).toBe(1224)
    // K_exercise sigue fijo en 8, no modulado por racha -> igual que streak=0
    expect(result.nextExerciseRating.value).toBe(1196)
  })

  it('racha=10 (por encima del cap=5) se comporta igual que racha=5', () => {
    const result = computeNextDifficulty(
      difficulty(1200),
      difficulty(1200),
      10,
      attempt({ correct: true, responseTimeMs: 0, timeLimitMs: 10000 }),
    )

    expect(result.nextUserRating.value).toBe(1224)
    expect(result.nextExerciseRating.value).toBe(1196)
  })

  it('usuario mas fuerte que el ejercicio y acierta: cambio pequeno (resultado esperado)', () => {
    const result = computeNextDifficulty(
      difficulty(1600),
      difficulty(1200),
      0,
      attempt({ correct: true, responseTimeMs: 0, timeLimitMs: 10000 }),
    )

    // E = 1/(1+10^-1) = 0.909090909... ; S-E = 0.090909091 ; K=32 -> +2.909090909
    expect(result.nextUserRating.value).toBeCloseTo(1602.909, 2)
    expect(result.nextExerciseRating.value).toBeCloseTo(1199.273, 2)
  })

  it('usuario mas debil que el ejercicio y falla: cambio pequeno (resultado esperado)', () => {
    const result = computeNextDifficulty(
      difficulty(1200),
      difficulty(1600),
      0,
      attempt({ correct: false, responseTimeMs: 5000, timeLimitMs: 10000 }),
    )

    // E = 1/(1+10^1) = 0.090909091... ; S-E = -0.090909091 ; K=32 -> -2.909090909
    expect(result.nextUserRating.value).toBeCloseTo(1197.091, 2)
    expect(result.nextExerciseRating.value).toBeCloseTo(1600.727, 2)
  })

  it('responseTimeMs > timeLimitMs en un acierto: el clamp evita S negativo, S=0.5', () => {
    const result = computeNextDifficulty(
      difficulty(1200),
      difficulty(1200),
      0,
      attempt({ correct: true, responseTimeMs: 15000, timeLimitMs: 10000 }),
    )

    // Igual que "justo al limite": S=0.5=E, sin cambio.
    expect(result.nextUserRating.value).toBe(1200)
    expect(result.nextExerciseRating.value).toBe(1200)
  })
})
