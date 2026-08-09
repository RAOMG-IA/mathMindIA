import { describe, expect, it } from 'vitest'
import { isValidEmail } from './index'

describe('isValidEmail', () => {
  it('acepta un email con formato válido', () => {
    expect(isValidEmail('a@b.com')).toBe(true)
  })

  it('rechaza un email sin @', () => {
    expect(isValidEmail('ab.com')).toBe(false)
  })

  it('rechaza un email sin dominio', () => {
    expect(isValidEmail('a@b')).toBe(false)
  })

  it('rechaza un email con espacios', () => {
    expect(isValidEmail('a b@c.com')).toBe(false)
  })

  it('rechaza una cadena vacía', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rechaza un email con más de un @', () => {
    expect(isValidEmail('a@b@c.com')).toBe(false)
  })
})
