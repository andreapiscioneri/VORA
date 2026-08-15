import { randomBytes, createHash } from 'node:crypto'
import { getDb } from './firebase'

const COLLECTION = 'authTokens'

export type AuthTokenType = 'verify-email' | 'reset-password'

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

// The raw token goes out in the email link; only its hash is stored, same
// principle as a password — a Firestore read of this collection alone
// can't be used to impersonate anyone.
export async function createAuthToken(userId: string, type: AuthTokenType, ttlMs: number): Promise<string> {
  const raw = randomBytes(32).toString('hex')
  const now = Date.now()
  await getDb()
    .collection(COLLECTION)
    .add({
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(now + ttlMs).toISOString(),
      createdAt: new Date(now).toISOString(),
    })
  return raw
}

// One-time use: consuming a valid token deletes it, so a leaked/reused
// link can't be replayed. Returns null on any invalid/expired/wrong-type token.
export async function consumeAuthToken(raw: string, type: AuthTokenType): Promise<string | null> {
  const db = getDb()
  const hash = hashToken(raw)
  const snap = await db.collection(COLLECTION).where('tokenHash', '==', hash).where('type', '==', type).limit(1).get()
  if (snap.empty) return null

  const doc = snap.docs[0]
  const data = doc.data()
  await doc.ref.delete()

  if (new Date(data.expiresAt).getTime() < Date.now()) return null
  return data.userId as string
}
