import { createHmac, randomBytes, createHash, timingSafeEqual } from 'node:crypto'
import { getDb } from './firebase'

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
const REFRESH_COLLECTION = 'mobileRefreshTokens'

// Reuses the secret nuxt-auth-utils already requires (NUXT_SESSION_PASSWORD,
// used to seal the web session cookie) rather than introducing a second
// required env var — it's just an HMAC key here, a different use of the
// same "only the server can produce a valid one of these" secret.
function getSecret(): string {
  const secret = process.env.NUXT_SESSION_PASSWORD
  if (!secret) throw new Error('NUXT_SESSION_PASSWORD is not set')
  return secret
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

// Stateless by design: verifying an access token on every mobile API call
// must not cost a Firestore read (unlike the refresh token below, which is
// used rarely). The payload + an HMAC signature is the whole token; a
// tampered payload fails the signature check without ever touching the DB.
export function signAccessToken(userId: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + ACCESS_TOKEN_TTL_MS
  const payload = base64url(JSON.stringify({ userId, expiresAt }))
  const signature = base64url(createHmac('sha256', getSecret()).update(payload).digest())
  return { token: `${payload}.${signature}`, expiresAt }
}

export function verifyAccessToken(token: string): string | null {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expectedSignature = base64url(createHmac('sha256', getSecret()).update(payload).digest())
  const a = Buffer.from(signature)
  const b = Buffer.from(expectedSignature)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const { userId, expiresAt } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as { userId: string; expiresAt: number }
    if (typeof expiresAt !== 'number' || expiresAt < Date.now()) return null
    return userId
  } catch {
    return null
  }
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

// Opaque, DB-backed and long-lived — unlike the access token, this one
// must be revocable (logout, a stolen device) so it can't be stateless.
// Rotated on every use (see rotateRefreshToken): a refresh token is
// single-use, and reuse of an already-consumed one is a signal the token
// leaked, which is why rotation deletes the old row before minting a new
// one rather than just extending its expiry.
export async function createRefreshToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString('hex')
  await getDb()
    .collection(REFRESH_COLLECTION)
    .add({
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString(),
      createdAt: new Date().toISOString(),
    })
  return raw
}

export async function rotateRefreshToken(raw: string): Promise<{ userId: string; refreshToken: string } | null> {
  const db = getDb()
  const hash = hashToken(raw)
  const snap = await db.collection(REFRESH_COLLECTION).where('tokenHash', '==', hash).limit(1).get()
  if (snap.empty) return null

  const doc = snap.docs[0]
  const data = doc.data()
  await doc.ref.delete()

  if (new Date(data.expiresAt).getTime() < Date.now()) return null

  const userId = data.userId as string
  const refreshToken = await createRefreshToken(userId)
  return { userId, refreshToken }
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const db = getDb()
  const hash = hashToken(raw)
  const snap = await db.collection(REFRESH_COLLECTION).where('tokenHash', '==', hash).limit(1).get()
  if (snap.empty) return
  await snap.docs[0].ref.delete()
}

// Used on password reset / "sign out everywhere" — without this a
// password change wouldn't actually end sessions already holding a
// refresh token.
export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  const db = getDb()
  const snap = await db.collection(REFRESH_COLLECTION).where('userId', '==', userId).get()
  await Promise.all(snap.docs.map((doc) => doc.ref.delete()))
}
