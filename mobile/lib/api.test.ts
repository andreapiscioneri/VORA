import { api, ApiError, API_BASE } from './api'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  jest.restoreAllMocks()
})

describe('API_BASE', () => {
  it('points at the local VORA server on iOS (default test platform)', () => {
    expect(API_BASE).toBe('http://localhost:3100/api')
  })
})

describe('api.get', () => {
  it('returns parsed JSON on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: '1', title: 'Test' }],
    }) as unknown as typeof fetch

    const result = await api.get<{ id: string; title: string }[]>('/tasks')
    expect(result).toEqual([{ id: '1', title: 'Test' }])
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/tasks`,
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
    )
  })

  it('throws ApiError with the response status on failure', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Task not found',
    }) as unknown as typeof fetch

    await expect(api.get('/tasks/missing')).rejects.toMatchObject({
      status: 404,
      message: 'Task not found',
    })
  })

  it('produces an instance of ApiError, not a generic Error', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'boom',
    }) as unknown as typeof fetch

    await expect(api.get('/tasks')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('api.post', () => {
  it('sends a JSON body with the POST method', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: '2' }),
    }) as unknown as typeof fetch

    await api.post('/tasks', { title: 'New task' })
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/tasks`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'New task' }) })
    )
  })
})

describe('api.delete', () => {
  it('returns undefined on a 204 No Content response', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
    }) as unknown as typeof fetch

    const result = await api.delete('/tasks/1')
    expect(result).toBeUndefined()
  })
})
