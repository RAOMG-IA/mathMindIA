import { describe, expect, it } from 'vitest'
import { computeAccuracyPercent, formatAvgResponseTime, formatRatingChange } from './SessionSummaryScreen.format'

describe('computeAccuracyPercent', () => {
  it('calcula el porcentaje de aciertos redondeado', () => {
    expect(computeAccuracyPercent(3, 4)).toBe(75)
  })

  it('devuelve null si no hubo intentos (evita dividir entre cero)', () => {
    expect(computeAccuracyPercent(0, 0)).toBeNull()
  })

  it('devuelve 0 si hubo intentos pero ningun acierto', () => {
    expect(computeAccuracyPercent(0, 5)).toBe(0)
  })

  it('devuelve 100 si todos los intentos fueron correctos', () => {
    expect(computeAccuracyPercent(5, 5)).toBe(100)
  })
})

describe('formatAvgResponseTime', () => {
  it('formatea milisegundos como segundos con un decimal', () => {
    expect(formatAvgResponseTime(3200)).toBe('3.2s')
  })

  it('redondea a un decimal', () => {
    expect(formatAvgResponseTime(1050)).toBe('1.1s')
  })
})

describe('formatRatingChange', () => {
  it('antepone "+" a un cambio positivo', () => {
    expect(formatRatingChange(15)).toBe('+15.0')
  })

  it('deja el signo "-" tal cual en un cambio negativo', () => {
    expect(formatRatingChange(-8)).toBe('-8.0')
  })

  it('no antepone signo a un cambio de cero', () => {
    expect(formatRatingChange(0)).toBe('0.0')
  })

  it('redondea a 1 decimal el float que devuelve AdaptiveDifficultyEngine (ADR-005)', () => {
    expect(formatRatingChange(21.974072196278257)).toBe('+22.0')
  })
})
