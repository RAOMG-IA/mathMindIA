import { describe, expect, it } from 'vitest'
import { MIN_PASSWORD_LENGTH } from '@mathmind/shared-utils'
import { validateLoginForm } from './LoginScreen.validation'

describe('validateLoginForm', () => {
  it('sin errores con email y contraseña válidos', () => {
    expect(validateLoginForm('a@b.com', 'password123')).toEqual({})
  })

  it('error de email si el formato no es válido', () => {
    const errors = validateLoginForm('no-es-un-email', 'password123')
    expect(errors.email).toBeDefined()
    expect(errors.password).toBeUndefined()
  })

  it(`error de contraseña si tiene menos de ${MIN_PASSWORD_LENGTH} caracteres`, () => {
    const errors = validateLoginForm('a@b.com', 'corta')
    expect(errors.password).toBeDefined()
    expect(errors.email).toBeUndefined()
  })

  it('devuelve ambos errores si los dos campos son inválidos', () => {
    const errors = validateLoginForm('no-es-un-email', 'corta')
    expect(errors.email).toBeDefined()
    expect(errors.password).toBeDefined()
  })
})
