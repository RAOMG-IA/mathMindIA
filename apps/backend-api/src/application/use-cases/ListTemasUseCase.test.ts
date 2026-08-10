// Trazabilidad: ADR-006 adenda 2026-08-10 (GET /temas, US-003).
//
// TDD Red: ListTemasUseCase todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { describe, expect, it } from 'vitest'
import { InMemoryTemaRepository } from '@mathmind/shared-testing'
import type { Tema } from '@mathmind/shared-domain'
import { ListTemasUseCase } from './ListTemasUseCase.js'

function aTema(overrides: Partial<Tema> = {}): Tema {
  return {
    code: 'arit.suma-resta',
    area: 'arit',
    label: 'Suma y resta',
    description: 'Operaciones basicas de suma y resta mental',
    academicLevels: [{ level: 'Primaria', difficultyRange: { min: 500, max: 750 } }],
    ...overrides,
  }
}

describe('ListTemasUseCase', () => {
  it('devuelve el catalogo completo del TemaRepository', async () => {
    const temaA = aTema()
    const temaB = aTema({ code: 'arit.fracciones', label: 'Fracciones' })
    const temas = new InMemoryTemaRepository([temaA, temaB])
    const useCase = new ListTemasUseCase(temas)

    const result = await useCase.execute()

    expect(result).toHaveLength(2)
    expect(result.map((tema) => tema.code).sort()).toEqual(['arit.fracciones', 'arit.suma-resta'])
  })

  it('devuelve un array vacio si el catalogo esta vacio', async () => {
    const useCase = new ListTemasUseCase(new InMemoryTemaRepository([]))

    const result = await useCase.execute()

    expect(result).toEqual([])
  })
})
