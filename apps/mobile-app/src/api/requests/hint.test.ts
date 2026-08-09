import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestHintRequest } from './hint'

describe('hint requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requestHintRequest llama a POST /hints con el body serializado', async () => {
    const responseBody = { content: 'Piensa en agrupar de 2 en 2', order: 1, hintsUsedSoFar: 1 }
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(responseBody), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await requestHintRequest({ sessionId: 's1', exerciseId: 'e1', elapsedMs: 4000 })

    expect(result).toEqual(responseBody)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/hints')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ sessionId: 's1', exerciseId: 'e1', elapsedMs: 4000 })
  })
})
