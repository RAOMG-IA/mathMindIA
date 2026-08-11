import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionStore } from '../store/useSessionStore'
import { fetchClient } from './fetchClient'

describe('fetchClient', () => {
  beforeEach(() => {
    useSessionStore.setState({ userId: 'u1', email: 'a@b.com', sessionToken: 'tok-1', isHydrated: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('añade Authorization: Bearer <sessionToken> en rutas protegidas', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await fetchClient('/sessions')

    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBe('Bearer tok-1')
  })

  it('no añade Authorization en /auth/register ni /auth/login', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await fetchClient('/auth/login', { method: 'POST' })

    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBeNull()
  })

  it('devuelve el body parseado como JSON en una respuesta ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ score: 42 }), { status: 200 })),
    )

    const result = await fetchClient<{ score: number }>('/users/me/statistics')

    expect(result).toEqual({ score: 42 })
  })

  it('lanza un error con el mensaje del campo "error" en una respuesta no-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'Forbidden or invalid session' }), { status: 403 })),
    )

    await expect(fetchClient('/sessions/end', { method: 'POST' })).rejects.toThrow(
      'Forbidden or invalid session',
    )
  })

  it('en un 401 de una ruta protegida, cierra la sesion (sessionToken invalido/expirado)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 })),
    )

    await expect(fetchClient('/sessions/end', { method: 'POST' })).rejects.toThrow('Invalid session')

    expect(useSessionStore.getState().sessionToken).toBeNull()
  })

  it('en un 401 de una ruta publica (credenciales invalidas en login), no toca la sesion', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })),
    )

    await expect(fetchClient('/auth/login', { method: 'POST' })).rejects.toThrow('Invalid credentials')

    expect(useSessionStore.getState().sessionToken).toBe('tok-1')
  })
})
