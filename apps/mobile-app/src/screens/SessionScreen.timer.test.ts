import { describe, expect, it } from 'vitest'
import { computeTimerState } from './SessionScreen.timer'

describe('computeTimerState', () => {
  it('sin expirar: remainingMs positivo, expired false', () => {
    const state = computeTimerState(1000, 10000, 4000)
    expect(state.remainingMs).toBe(7000)
    expect(state.expired).toBe(false)
  })

  it('justo al expirar: remainingMs 0, expired true', () => {
    const state = computeTimerState(1000, 10000, 11000)
    expect(state.remainingMs).toBe(0)
    expect(state.expired).toBe(true)
  })

  it('tras expirar: remainingMs se queda en 0 (no negativo), expired true', () => {
    const state = computeTimerState(1000, 10000, 50000)
    expect(state.remainingMs).toBe(0)
    expect(state.expired).toBe(true)
  })

  it('en el instante en que se muestra el ejercicio: remainingMs = timeLimitMs completo', () => {
    const state = computeTimerState(1000, 10000, 1000)
    expect(state.remainingMs).toBe(10000)
    expect(state.expired).toBe(false)
  })
})
