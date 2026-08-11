import { describe, expect, it } from 'vitest'
import type { TopicStatDto } from '@mathmind/shared-types'
import { deriveTopicBreakdown } from './StatisticsScreen.validation'

function aTopic(overrides: Partial<TopicStatDto> = {}): TopicStatDto {
  return {
    topic: 'arit.suma-resta',
    area: 'arit',
    accuracy: 0.5,
    attemptCount: 5,
    ...overrides,
  }
}

describe('deriveTopicBreakdown', () => {
  it('devuelve listas vacias si no hay temas (Usuario sin historial)', () => {
    expect(deriveTopicBreakdown([])).toEqual({ strengths: [], weaknesses: [] })
  })

  it('excluye temas por debajo del minimo de intentos para evitar conclusiones poco fiables', () => {
    const pocosIntentos = aTopic({ accuracy: 0.9, attemptCount: 2 })
    expect(deriveTopicBreakdown([pocosIntentos])).toEqual({ strengths: [], weaknesses: [] })
  })

  it('ordena strengths por accuracy descendente entre los temas elegibles', () => {
    const bajo = aTopic({ topic: 'a', accuracy: 0.3, attemptCount: 3 })
    const alto = aTopic({ topic: 'b', accuracy: 0.9, attemptCount: 3 })
    const medio = aTopic({ topic: 'c', accuracy: 0.6, attemptCount: 3 })

    expect(deriveTopicBreakdown([bajo, alto, medio]).strengths).toEqual([alto, medio, bajo])
  })

  it('ordena weaknesses por accuracy ascendente entre los temas elegibles', () => {
    const bajo = aTopic({ topic: 'a', accuracy: 0.3, attemptCount: 3 })
    const alto = aTopic({ topic: 'b', accuracy: 0.9, attemptCount: 3 })
    const medio = aTopic({ topic: 'c', accuracy: 0.6, attemptCount: 3 })

    expect(deriveTopicBreakdown([bajo, alto, medio]).weaknesses).toEqual([bajo, medio, alto])
  })

  it('corta a los 3 mejores/peores aunque haya mas temas elegibles', () => {
    const temas = Array.from({ length: 5 }, (_, i) =>
      aTopic({ topic: `tema-${i}`, accuracy: i / 10, attemptCount: 3 }),
    )

    const { strengths, weaknesses } = deriveTopicBreakdown(temas)
    expect(strengths).toHaveLength(3)
    expect(weaknesses).toHaveLength(3)
  })

  it('ignora los temas no elegibles aunque tengan accuracy extrema', () => {
    const noElegible = aTopic({ topic: 'perfecto-pero-poco-fiable', accuracy: 1, attemptCount: 1 })
    const elegible = aTopic({ topic: 'normal', accuracy: 0.5, attemptCount: 3 })

    const { strengths, weaknesses } = deriveTopicBreakdown([noElegible, elegible])
    expect(strengths).toEqual([elegible])
    expect(weaknesses).toEqual([elegible])
  })
})
