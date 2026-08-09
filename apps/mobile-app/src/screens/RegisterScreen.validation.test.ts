import { describe, expect, it } from 'vitest'
import { MIN_PASSWORD_LENGTH } from '@mathmind/shared-utils'
import { validateRegisterForm } from './RegisterScreen.validation'

describe('validateRegisterForm', () => {
  it('sin errores con email, contraseña y nivel académico válidos', () => {
    expect(validateRegisterForm('a@b.com', 'password123', 'Secundaria')).toEqual({})
  })

  it('error de email si el formato no es válido', () => {
    const errors = validateRegisterForm('no-es-un-email', 'password123', 'Secundaria')
    expect(errors.email).toBeDefined()
    expect(errors.password).toBeUndefined()
    expect(errors.academicLevel).toBeUndefined()
  })

  it(`error de contraseña si tiene menos de ${MIN_PASSWORD_LENGTH} caracteres`, () => {
    const errors = validateRegisterForm('a@b.com', 'corta', 'Secundaria')
    expect(errors.password).toBeDefined()
  })

  it('error de nivel académico si no se ha seleccionado (US-001: obligatorio)', () => {
    const errors = validateRegisterForm('a@b.com', 'password123', null)
    expect(errors.academicLevel).toBeDefined()
    expect(errors.email).toBeUndefined()
    expect(errors.password).toBeUndefined()
  })

  it('devuelve los tres errores si los tres campos son inválidos', () => {
    const errors = validateRegisterForm('no-es-un-email', 'corta', null)
    expect(errors.email).toBeDefined()
    expect(errors.password).toBeDefined()
    expect(errors.academicLevel).toBeDefined()
  })
})
