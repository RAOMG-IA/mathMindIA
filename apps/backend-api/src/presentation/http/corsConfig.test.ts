// TDD Red: corsConfig todavia no tiene implementacion (declare function, sin cuerpo). Se espera
// que este archivo FALLE al ejecutarse hasta que el Developer Agent lo implemente.
import { describe, expect, it } from 'vitest'
import { isOriginAllowed, parseAllowedOrigins } from './corsConfig.js'

describe('parseAllowedOrigins', () => {
  it('separa una lista por comas, recortando espacios', () => {
    expect(parseAllowedOrigins('http://localhost:8081, http://localhost:19006')).toEqual([
      'http://localhost:8081',
      'http://localhost:19006',
    ])
  })

  it('devuelve [] si la variable no esta definida', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([])
  })

  it('devuelve [] si la variable esta vacia', () => {
    expect(parseAllowedOrigins('')).toEqual([])
  })

  it('descarta entradas vacias (comas repetidas o al final)', () => {
    expect(parseAllowedOrigins('http://localhost:8081,,')).toEqual(['http://localhost:8081'])
  })
})

describe('isOriginAllowed', () => {
  const allowed = ['http://localhost:8081', 'https://mathmind.example.com']

  it('permite un origin dentro de la lista', () => {
    expect(isOriginAllowed('http://localhost:8081', allowed)).toBe(true)
  })

  it('rechaza un origin fuera de la lista', () => {
    expect(isOriginAllowed('https://evil.example.com', allowed)).toBe(false)
  })

  it('rechaza cualquier origin si la lista esta vacia (privacidad por defecto)', () => {
    expect(isOriginAllowed('http://localhost:8081', [])).toBe(false)
  })

  it('permite peticiones sin cabecera Origin (no-navegador: apps nativas, curl, servidor a servidor)', () => {
    expect(isOriginAllowed(undefined, allowed)).toBe(true)
  })
})
