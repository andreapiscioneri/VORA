import { getRequestIP, setResponseHeader, createError, type H3Event } from 'h3'

interface Bucket {
  count: number
  windowStart: number
}

// In-memory sliding-window limiter. Deliberately simple: this is a
// single-process Nitro server (see DEPLOYMENT.md — no horizontal scaling
// configured), so an in-memory Map is honest about being process-local and
// resetting on restart, rather than pretending to be a distributed limiter
// without Redis. If VORA is ever deployed across multiple instances, this
// needs to move to a shared store (Redis, Firestore) — noted here so it
// isn't silently wrong under that assumption.
const buckets = new Map<string, Bucket>()

// Bound memory: an attacker could otherwise grow this map by hitting the
// endpoint from many IPs. Evict oldest entries once the map gets large.
const MAX_BUCKETS = 10_000

// Dev/test-only escape hatch: e2e runs and manual local verification both
// hammer /api/auth/register from the same loopback IP well past any real
// user's rate, tripping the very limiter this file implements. Gated by an
// env var only ever set in local dev — never in production — so this can't
// be used to bypass the limiter in a real deployment.
const bypassed = process.env.DISABLE_RATE_LIMIT === '1'

export function checkRateLimit(event: H3Event, key: string, opts: { max: number; windowMs: number }): void {
  if (bypassed) return
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const bucketKey = `${key}:${ip}`
  const now = Date.now()

  const existing = buckets.get(bucketKey)
  if (!existing || now - existing.windowStart > opts.windowMs) {
    if (buckets.size >= MAX_BUCKETS) {
      const oldestKey = buckets.keys().next().value
      if (oldestKey) buckets.delete(oldestKey)
    }
    buckets.set(bucketKey, { count: 1, windowStart: now })
    return
  }

  existing.count += 1
  if (existing.count > opts.max) {
    const retryAfterSeconds = Math.ceil((opts.windowMs - (now - existing.windowStart)) / 1000)
    setResponseHeader(event, 'Retry-After', retryAfterSeconds)
    throw createError({ statusCode: 429, statusMessage: 'Too many requests — please try again shortly.' })
  }
}
