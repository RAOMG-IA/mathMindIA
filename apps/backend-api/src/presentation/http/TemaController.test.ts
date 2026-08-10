// Trazabilidad: ADR-006 adenda 2026-08-10 + mapa de rutas ARCHITECTURE.md (GET /temas).
//
// TDD Red: TemaController todavia no tiene implementacion (declare class, sin cuerpo). Se
// espera que este archivo FALLE al ejecutarse hasta que el Developer Agent la implemente.
import { describe, expect, it } from 'vitest'
import { InMemoryTemaRepository } from '@mathmind/shared-testing'
import type { Tema } from '@mathmind/shared-domain'
import { TemaController } from './TemaController.js'
import { ListTemasUseCase } from '../../application/use-cases/ListTemasUseCase.js'

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

describe('TemaController', () => {
  it('mapea el catalogo de ListTemasUseCase -> GetTemasResponseDto', async () => {
    const temas = new InMemoryTemaRepository([aTema({ prerequisites: ['arit.conteo'] })])
    const controller = new TemaController(new ListTemasUseCase(temas))

    const result = await controller.listTemas()

    expect(result).toEqual({
      temas: [
        {
          code: 'arit.suma-resta',
          area: 'arit',
          label: 'Suma y resta',
          description: 'Operaciones basicas de suma y resta mental',
          academicLevels: [{ level: 'Primaria', difficultyRange: { min: 500, max: 750 } }],
          prerequisites: ['arit.conteo'],
        },
      ],
    })
  })

  it('devuelve temas: [] si el catalogo esta vacio', async () => {
    const controller = new TemaController(new ListTemasUseCase(new InMemoryTemaRepository([])))

    const result = await controller.listTemas()

    expect(result).toEqual({ temas: [] })
  })
})
