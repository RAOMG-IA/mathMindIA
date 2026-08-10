import { describe, expect, it } from 'vitest'
import type { TemaDto } from './HomeScreen.validation'
import { temasForLevel, validateHomeForm } from './HomeScreen.validation'

function aTema(overrides: Partial<TemaDto> = {}): TemaDto {
  return {
    code: 'arit.suma-resta',
    area: 'arit',
    label: 'Suma y resta',
    description: 'Operaciones basicas',
    academicLevels: [{ level: 'Primaria', difficultyRange: { min: 500, max: 750 } }],
    ...overrides,
  }
}

describe('temasForLevel', () => {
  it('devuelve solo los temas cuyo academicLevels incluye el nivel elegido', () => {
    const primaria = aTema({ code: 'arit.suma-resta' })
    const bachillerato = aTema({
      code: 'calc.limites',
      academicLevels: [{ level: 'Bachillerato', difficultyRange: { min: 1650, max: 1850 } }],
    })

    expect(temasForLevel([primaria, bachillerato], 'Primaria')).toEqual([primaria])
  })

  it('devuelve [] si no hay nivel elegido', () => {
    expect(temasForLevel([aTema()], null)).toEqual([])
  })

  it('devuelve [] si ningun tema aplica al nivel', () => {
    expect(temasForLevel([aTema()], 'Ingenieria')).toEqual([])
  })
})

describe('validateHomeForm', () => {
  const disponibles = [aTema()]

  it('sin errores con mode/academicLevel/topic validos', () => {
    expect(validateHomeForm('Test', 'Primaria', 'arit.suma-resta', disponibles)).toEqual({})
  })

  it('error de mode si no se ha elegido', () => {
    const errors = validateHomeForm(null, 'Primaria', 'arit.suma-resta', disponibles)
    expect(errors.mode).toBeDefined()
  })

  it('error de academicLevel si no se ha elegido', () => {
    const errors = validateHomeForm('Test', null, 'arit.suma-resta', disponibles)
    expect(errors.academicLevel).toBeDefined()
  })

  it('error de topic si no se ha elegido', () => {
    const errors = validateHomeForm('Test', 'Primaria', null, disponibles)
    expect(errors.topic).toBeDefined()
  })

  it('error de topic si el tema no esta en el catalogo disponible para ese nivel (Tema inexistente)', () => {
    const errors = validateHomeForm('Test', 'Primaria', 'calc.limites', disponibles)
    expect(errors.topic).toBeDefined()
  })
})
