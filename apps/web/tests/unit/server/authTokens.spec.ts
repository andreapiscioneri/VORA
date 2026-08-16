import { beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory fake of the one Firestore surface authTokens.ts touches
// (collection().add / .where().where().limit().get()), so this test
// exercises the real hashing/expiry/one-time-use logic without needing the
// Firestore emulator running.
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
              const matches = docs.filter(
                (d) => !d.deleted && filters.every(([f, v]) => d.data[f] === v),
              )
              return {
                empty: matches.length === 0,
                docs: matches.map((d) => ({
                  data: () => d.data,
                  ref: { delete: async () => { d.deleted = true } },
                })),
              }
            },
          }),
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

describe('authTokens', () => {
  beforeEach(() => {
    vi.resetModules()
    fakeDb = createFakeDb()
  })

  it('creates a token, then consumes it exactly once', async () => {
    const { createAuthToken, consumeAuthToken } = await import('../../../server/utils/authTokens')
    const raw = await createAuthToken('user-1', 'verify-email', 60_000)
    expect(raw).toHaveLength(64) // 32 bytes hex-encoded

    const userId = await consumeAuthToken(raw, 'verify-email')
    expect(userId).toBe('user-1')

    // Second consumption of the same raw token must fail — it was deleted.
    const second = await consumeAuthToken(raw, 'verify-email')
    expect(second).toBeNull()
  })

  it('never stores the raw token — only its hash', async () => {
    const { createAuthToken } = await import('../../../server/utils/authTokens')
    const raw = await createAuthToken('user-1', 'reset-password', 60_000)
    const stored = fakeDb.docs[0].data
    expect(stored.tokenHash).not.toBe(raw)
    expect(typeof stored.tokenHash).toBe('string')
    expect(stored.tokenHash).toHaveLength(64) // sha256 hex digest
  })

  it('rejects a token consumed under the wrong type', async () => {
    const { createAuthToken, consumeAuthToken } = await import('../../../server/utils/authTokens')
    const raw = await createAuthToken('user-1', 'verify-email', 60_000)
    const result = await consumeAuthToken(raw, 'reset-password')
    expect(result).toBeNull()
  })

  it('rejects an unknown/garbage token', async () => {
    const { consumeAuthToken } = await import('../../../server/utils/authTokens')
    expect(await consumeAuthToken('not-a-real-token', 'verify-email')).toBeNull()
  })

  it('rejects an expired token even though it existed', async () => {
    const { createAuthToken, consumeAuthToken } = await import('../../../server/utils/authTokens')
    const raw = await createAuthToken('user-1', 'verify-email', -1) // already expired
    const result = await consumeAuthToken(raw, 'verify-email')
    expect(result).toBeNull()
  })
})
