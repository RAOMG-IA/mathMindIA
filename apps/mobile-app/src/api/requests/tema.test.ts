import { afterEach, describe, expect, it, vi } from 'vitest'
import { getTemasRequest } from './tema'

describe('tema requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('getTemasRequest llama a GET /temas sin body', async () => {
    const responseBody = { temas: [{ code: 'arit.suma-resta', area: 'arit', label: 'Suma y resta', description: '', academicLevels: [] }] }
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(responseBody), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getTemasRequest()

    expect(result).toEqual(responseBody)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/temas')
    expect(init?.method ?? 'GET').toBe('GET')
    expect(init?.body).toBeUndefined()
  })
})
