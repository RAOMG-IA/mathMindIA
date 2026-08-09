import { afterEach, describe, expect, it, vi } from 'vitest'
import { submitAnswerRequest } from './answer'

describe('answer requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('submitAnswerRequest llama a POST /answers con el body serializado', async () => {
    const responseBody = { isCorrect: true, explanation: 'Porque 2+2=4' }
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(responseBody), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitAnswerRequest({
      sessionId: 's1',
      exerciseId: 'e1',
      submittedValue: '4',
      responseTimeMs: 2500,
    })

    expect(result).toEqual(responseBody)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/answers')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({
      sessionId: 's1',
      exerciseId: 'e1',
      submittedValue: '4',
      responseTimeMs: 2500,
    })
  })
})
