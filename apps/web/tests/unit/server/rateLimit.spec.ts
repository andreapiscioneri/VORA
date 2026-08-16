import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

// checkRateLimit reads `bypassed` from process.env at module-load time, so
// each test that needs a specific bypass state re-imports the module fresh.
async function freshCheckRateLimit() {
  vi.resetModules()
  const mod = await import('../../../server/utils/rateLimit')
  return mod.checkRateLimit
}

function fakeEvent(ip: string): H3Event {
  return {
    node: {
      req: { headers: {}, socket: { remoteAddress: ip } },
      res: { setHeader: vi.fn() },
    },
    web: undefined,
    context: {},
  } as unknown as H3Event
}

describe('checkRateLimit', () => {
  const originalEnv = process.env.DISABLE_RATE_LIMIT

  beforeEach(() => {
    delete process.env.DISABLE_RATE_LIMIT
  })

  afterEach(() => {
    process.env.DISABLE_RATE_LIMIT = originalEnv
  })

  it('allows requests under the limit', async () => {
    const checkRateLimit = await freshCheckRateLimit()
    const event = fakeEvent('1.1.1.1')
    for (let i = 0; i < 3; i++) {
      expect(() => checkRateLimit(event, 'test:under', { max: 3, windowMs: 60_000 })).not.toThrow()
    }
  })

  it('throws a 429 once the limit is exceeded, with a Retry-After header', async () => {
    const checkRateLimit = await freshCheckRateLimit()
    const event = fakeEvent('2.2.2.2')
    for (let i = 0; i < 3; i++) {
      checkRateLimit(event, 'test:exceed', { max: 3, windowMs: 60_000 })
    }
    try {
      checkRateLimit(event, 'test:exceed', { max: 3, windowMs: 60_000 })
      expect.unreachable('expected checkRateLimit to throw')
    } catch (err) {
      expect((err as { statusCode: number }).statusCode).toBe(429)
    }
    expect(event.node.res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number))
  })

  it('tracks separate buckets per IP', async () => {
    const checkRateLimit = await freshCheckRateLimit()
    const eventA = fakeEvent('3.3.3.3')
    const eventB = fakeEvent('4.4.4.4')
    checkRateLimit(eventA, 'test:perip', { max: 1, windowMs: 60_000 })
    // A second request from a different IP against the same key must not be
    // affected by A's bucket.
    expect(() => checkRateLimit(eventB, 'test:perip', { max: 1, windowMs: 60_000 })).not.toThrow()
    expect(() => checkRateLimit(eventA, 'test:perip', { max: 1, windowMs: 60_000 })).toThrow()
  })

  it('tracks separate buckets per key for the same IP', async () => {
    const checkRateLimit = await freshCheckRateLimit()
    const event = fakeEvent('5.5.5.5')
    checkRateLimit(event, 'test:keyA', { max: 1, windowMs: 60_000 })
    expect(() => checkRateLimit(event, 'test:keyB', { max: 1, windowMs: 60_000 })).not.toThrow()
  })

  it('resets the window after windowMs elapses', async () => {
    vi.useFakeTimers()
    const checkRateLimit = await freshCheckRateLimit()
    const event = fakeEvent('6.6.6.6')
    checkRateLimit(event, 'test:window', { max: 1, windowMs: 1000 })
    expect(() => checkRateLimit(event, 'test:window', { max: 1, windowMs: 1000 })).toThrow()
    vi.advanceTimersByTime(1001)
    expect(() => checkRateLimit(event, 'test:window', { max: 1, windowMs: 1000 })).not.toThrow()
    vi.useRealTimers()
  })

  it('is a no-op when DISABLE_RATE_LIMIT=1 (dev/e2e escape hatch)', async () => {
    process.env.DISABLE_RATE_LIMIT = '1'
    const checkRateLimit = await freshCheckRateLimit()
    const event = fakeEvent('7.7.7.7')
    for (let i = 0; i < 50; i++) {
      expect(() => checkRateLimit(event, 'test:bypass', { max: 1, windowMs: 60_000 })).not.toThrow()
    }
  })
})
