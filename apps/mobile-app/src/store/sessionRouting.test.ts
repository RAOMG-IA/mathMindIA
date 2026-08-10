import { describe, expect, it } from 'vitest'
import { resolveSessionRoute } from './sessionRouting'

describe('resolveSessionRoute', () => {
  it('devuelve loading mientras la sesion no se ha hidratado, con o sin token en memoria', () => {
    expect(resolveSessionRoute({ isHydrated: false, sessionToken: null })).toBe('loading')
    expect(resolveSessionRoute({ isHydrated: false, sessionToken: 'tok-1' })).toBe('loading')
  })

  it('devuelve login si ya esta hidratada pero no hay sessionToken persistido', () => {
    expect(resolveSessionRoute({ isHydrated: true, sessionToken: null })).toBe('login')
  })

  it('devuelve home si ya esta hidratada y hay un sessionToken', () => {
    expect(resolveSessionRoute({ isHydrated: true, sessionToken: 'tok-1' })).toBe('home')
  })
})
