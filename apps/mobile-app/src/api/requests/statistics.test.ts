import { afterEach, describe, expect, it, vi } from 'vitest'
import { getUserStatisticsRequest } from './statistics'

describe('statistics requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('getUserStatisticsRequest llama a GET /users/me/statistics sin body', async () => {
    const responseBody = { score: 100, rating: 1240, academicLevel: 'Secundaria', byTopic: [] }
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(responseBody), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getUserStatisticsRequest()

    expect(result).toEqual(responseBody)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/users/me/statistics')
    expect(init?.method ?? 'GET').toBe('GET')
    expect(init?.body).toBeUndefined()
  })
})
