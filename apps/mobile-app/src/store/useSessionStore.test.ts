import { beforeEach, describe, expect, it } from 'vitest'
import { useSessionStore } from './useSessionStore'
import type { TokenStorage } from './TokenStorage'

// Fake en memoria de TokenStorage (ADR-015) -- mismo criterio que los InMemory*/Fake* de
// packages/shared-testing, pero local: TokenStorage no es un puerto de shared-domain.
class InMemoryTokenStorage implements TokenStorage {
  private readonly values = new Map<string, string>()

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value)
  }

  async deleteItem(key: string): Promise<void> {
    this.values.delete(key)
  }
}

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ userId: null, email: null, sessionToken: null, isHydrated: false })
  })

  it('starts sin autenticar y sin hidratar', () => {
    const state = useSessionStore.getState()
    expect(state.sessionToken).toBeNull()
    expect(state.isHydrated).toBe(false)
  })

  it('login persiste la sesion en TokenStorage y actualiza el estado', async () => {
    const storage = new InMemoryTokenStorage()

    await useSessionStore.getState().login({ userId: 'u1', email: 'a@b.com', sessionToken: 'tok-1' }, storage)

    const state = useSessionStore.getState()
    expect(state.userId).toBe('u1')
    expect(state.email).toBe('a@b.com')
    expect(state.sessionToken).toBe('tok-1')
    expect(state.isHydrated).toBe(true)
    expect(await storage.getItem('mathmind.session')).toContain('tok-1')
  })

  it('hydrate restaura una sesion ya persistida', async () => {
    const storage = new InMemoryTokenStorage()
    await storage.setItem('mathmind.session', JSON.stringify({ userId: 'u1', email: 'a@b.com', sessionToken: 'tok-1' }))

    await useSessionStore.getState().hydrate(storage)

    const state = useSessionStore.getState()
    expect(state.userId).toBe('u1')
    expect(state.sessionToken).toBe('tok-1')
    expect(state.isHydrated).toBe(true)
  })

  it('hydrate sin sesion persistida deja el estado sin autenticar pero hidratado', async () => {
    const storage = new InMemoryTokenStorage()

    await useSessionStore.getState().hydrate(storage)

    const state = useSessionStore.getState()
    expect(state.sessionToken).toBeNull()
    expect(state.isHydrated).toBe(true)
  })

  it('logout limpia el estado y borra la sesion de TokenStorage', async () => {
    const storage = new InMemoryTokenStorage()
    await useSessionStore.getState().login({ userId: 'u1', email: 'a@b.com', sessionToken: 'tok-1' }, storage)

    await useSessionStore.getState().logout(storage)

    const state = useSessionStore.getState()
    expect(state.userId).toBeNull()
    expect(state.sessionToken).toBeNull()
    expect(await storage.getItem('mathmind.session')).toBeNull()
  })
})
