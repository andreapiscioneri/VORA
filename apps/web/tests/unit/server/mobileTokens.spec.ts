import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Same in-memory Firestore fake as authTokens.spec.ts — exercises the real
// hashing/expiry/rotation logic without the Firestore emulator running.
interface FakeDoc {
  id: string
  data: Record<string, unknown>
  deleted: boolean
}

function createFakeDb() {
  const docs: FakeDoc[] = []
  let counter = 0

  return {
    docs,
    collection: () => ({
      add: async (data: Record<string, unknown>) => {
        const doc: FakeDoc = { id: String(counter++), data, deleted: false }
        docs.push(doc)
        return { id: doc.id }
      },
      where: (field: string, _op: string, value: unknown) => {
        const filters: [string, unknown][] = [[field, value]]
        const chain = {
          where: (f: string, _o: string, v: unknown) => {
            filters.push([f, v])
            return chain
          },
          limit: (_n: number) => ({
            get: async () => {
              const matches = docs.filter((d) => !d.deleted && filters.every(([f, v]) => d.data[f] === v))
              return {
                empty: matches.length === 0,
                docs: matches.map((d) => ({ data: () => d.data, ref: { delete: async () => { d.deleted = true } } })),
              }
            },
          }),
          get: async () => {
            const matches = docs.filter((d) => !d.deleted && filters.every(([f, v]) => d.data[f] === v))
            return {
              empty: matches.length === 0,
              docs: matches.map((d) => ({ data: () => d.data, ref: { delete: async () => { d.deleted = true } } })),
            }
          },
        }
        return chain
      },
    }),
  }
}

let fakeDb: ReturnType<typeof createFakeDb>

vi.mock('../../../server/utils/firebase', () => ({
  getDb: () => fakeDb,
}))

const ORIGINAL_SECRET = process.env.NUXT_SESSION_PASSWORD

beforeEach(() => {
  vi.resetModules()
  fakeDb = createFakeDb()
  process.env.NUXT_SESSION_PASSWORD = 'test-secret-at-least-32-characters-long'
})

afterAll(() => {
  process.env.NUXT_SESSION_PASSWORD = ORIGINAL_SECRET
})

describe('access tokens', () => {
  it('signs a token that verifies back to the same userId', async () => {
    const { signAccessToken, verifyAccessToken } = await import('../../../server/utils/mobileTokens')
    const { token } = signAccessToken('user-1')
    expect(verifyAccessToken(token)).toBe('user-1')
  })

  it('rejects a tampered payload', async () => {
    const { signAccessToken, verifyAccessToken } = await import('../../../server/utils/mobileTokens')
    const { token } = signAccessToken('user-1')
    const [, signature] = token.split('.')
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'attacker', expiresAt: Date.now() + 60_000 })).toString('base64url')
    expect(verifyAccessToken(`${tamperedPayload}.${signature}`)).toBeNull()
  })

  it('rejects a garbage token', async () => {
    const { verifyAccessToken } = await import('../../../server/utils/mobileTokens')
    expect(verifyAccessToken('not-a-real-token')).toBeNull()
  })

  it('rejects an expired token even with a valid signature', async () => {
    vi.useFakeTimers()
    const { signAccessToken, verifyAccessToken } = await import('../../../server/utils/mobileTokens')
    const { token } = signAccessToken('user-1')
    vi.advanceTimersByTime(16 * 60 * 1000) // past the 15-minute TTL
    expect(verifyAccessToken(token)).toBeNull()
    vi.useRealTimers()
  })
})

describe('refresh tokens', () => {
  it('creates a token, rotates it, and invalidates the old one', async () => {
    const { createRefreshToken, rotateRefreshToken } = await import('../../../server/utils/mobileTokens')
    const raw = await createRefreshToken('user-1')
    expect(raw).toHaveLength(64) // 32 bytes hex-encoded

    const rotated = await rotateRefreshToken(raw)
    expect(rotated?.userId).toBe('user-1')
    expect(rotated?.refreshToken).not.toBe(raw)

    // The original token was consumed by rotation — reusing it must fail.
    expect(await rotateRefreshToken(raw)).toBeNull()
    // The new one it minted works.
    expect((await rotateRefreshToken(rotated!.refreshToken))?.userId).toBe('user-1')
  })

  it('never stores the raw refresh token — only its hash', async () => {
    const { createRefreshToken } = await import('../../../server/utils/mobileTokens')
    const raw = await createRefreshToken('user-1')
    const stored = fakeDb.docs[0].data
    expect(stored.tokenHash).not.toBe(raw)
    expect(stored.tokenHash).toHaveLength(64)
  })

  it('revokes a specific refresh token', async () => {
    const { createRefreshToken, revokeRefreshToken, rotateRefreshToken } = await import('../../../server/utils/mobileTokens')
    const raw = await createRefreshToken('user-1')
    await revokeRefreshToken(raw)
    expect(await rotateRefreshToken(raw)).toBeNull()
  })

  it('revokes every refresh token for a user', async () => {
    const { createRefreshToken, revokeAllRefreshTokensForUser, rotateRefreshToken } = await import('../../../server/utils/mobileTokens')
    const a = await createRefreshToken('user-1')
    const b = await createRefreshToken('user-1')
    const other = await createRefreshToken('user-2')

    await revokeAllRefreshTokensForUser('user-1')

    expect(await rotateRefreshToken(a)).toBeNull()
    expect(await rotateRefreshToken(b)).toBeNull()
    expect((await rotateRefreshToken(other))?.userId).toBe('user-2')
  })
})
