import { describe, expect, it } from 'vitest'
import { MENTAL_MATH_TIPS, pickMentalMathTip } from './SessionScreen.mentalMathTips'

describe('pickMentalMathTip', () => {
  it('devuelve siempre la misma nota para el mismo id de ejercicio (determinista)', () => {
    const first = pickMentalMathTip('exercise-123')
    const second = pickMentalMathTip('exercise-123')
    expect(first).toBe(second)
  })

  it('devuelve una nota que pertenece al catalogo', () => {
    expect(MENTAL_MATH_TIPS).toContain(pickMentalMathTip('exercise-abc'))
  })

  it('no revienta con un id vacio', () => {
    expect(() => pickMentalMathTip('')).not.toThrow()
    expect(MENTAL_MATH_TIPS).toContain(pickMentalMathTip(''))
  })

  it('ids distintos pueden devolver notas distintas (no siempre la misma)', () => {
    const picks = new Set(['a', 'bb', 'ccc', 'dddd', 'eeeee'].map(pickMentalMathTip))
    expect(picks.size).toBeGreaterThan(1)
  })
})
