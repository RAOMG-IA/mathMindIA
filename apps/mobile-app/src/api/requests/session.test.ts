import { afterEach, describe, expect, it, vi } from 'vitest'
import { endSessionRequest, startSessionRequest } from './session'

describe('session requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('startSessionRequest llama a POST /sessions con el body serializado', async () => {
    const responseBody = {
      session: { id: 's1', mode: 'Test', academicLevel: 'Secundaria', startedAt: '2026-08-09T00:00:00.000Z' },
      exercise: { id: 'e1', type: 'Test', statement: '2+2', options: ['3', '4', '5'], timeLimitMs: 15000 },
    }
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(responseBody), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await startSessionRequest({ mode: 'Test', academicLevel: 'Secundaria', topic: 'ARI-01' })

    expect(result).toEqual(responseBody)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/sessions')
    expect(String(url)).not.toContain('/sessions/end')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ mode: 'Test', academicLevel: 'Secundaria', topic: 'ARI-01' })
  })

  it('endSessionRequest llama a POST /sessions/end con el body serializado', async () => {
    const responseBody = { totalAttempts: 5, correctAttempts: 4, avgResponseTimeMs: 3200, ratingChange: 12.5 }
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(responseBody), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await endSessionRequest({ sessionId: 's1' })

    expect(result).toEqual(responseBody)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/sessions/end')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ sessionId: 's1' })
  })
})
