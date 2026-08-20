import { afterEach, describe, expect, it, vi } from 'vitest'
import { guestLoginRequest, loginRequest, registerRequest } from './auth'

describe('auth requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registerRequest llama a POST /auth/register con el body serializado', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ userId: 'u1', sessionToken: 'tok-1' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await registerRequest({ email: 'a@b.com', password: 'password123', academicLevel: 'Secundaria' })

    expect(result).toEqual({ userId: 'u1', sessionToken: 'tok-1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/auth/register')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'a@b.com',
      password: 'password123',
      academicLevel: 'Secundaria',
    })
  })

  it('loginRequest llama a POST /auth/login con el body serializado', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ userId: 'u1', sessionToken: 'tok-1' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await loginRequest({ email: 'a@b.com', password: 'password123' })

    expect(result).toEqual({ userId: 'u1', sessionToken: 'tok-1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/auth/login')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'a@b.com', password: 'password123' })
  })

  it('guestLoginRequest (US-009) llama a POST /auth/guest sin body', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ userId: 'u1', sessionToken: 'tok-1', email: 'publico123456@invitado.mathmind.local' }), {
          status: 200,
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await guestLoginRequest()

    expect(result).toEqual({ userId: 'u1', sessionToken: 'tok-1', email: 'publico123456@invitado.mathmind.local' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/auth/guest')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBeUndefined()
  })
})
