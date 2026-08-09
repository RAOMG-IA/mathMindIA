import { describe, expect, it } from 'vitest'
import { isValidPassword, MIN_PASSWORD_LENGTH } from './index'

describe('isValidPassword', () => {
  it(`acepta una contraseña de exactamente ${MIN_PASSWORD_LENGTH} caracteres`, () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBe(true)
  })

  it('rechaza una contraseña más corta que el mínimo', () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(false)
  })

  it('acepta una contraseña más larga que el mínimo', () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH + 5))).toBe(true)
  })
})
