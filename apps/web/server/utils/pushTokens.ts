import type { PushToken } from '~/shared/types/notification'
import type { PushTokenInputSchema } from '~/shared/validation/notification'
import { getDb } from './firebase'

const COLLECTION = 'pushTokens'

function toPushToken(id: string, data: FirebaseFirestore.DocumentData): PushToken {
  return {
    id,
    userId: data.userId ?? '',
    token: data.token ?? '',
    platform: data.platform ?? 'ios',
    createdAt: data.createdAt ?? new Date().toISOString(),
  }
}

// Registers (or re-confirms) a device's Expo push token for a user. Idempotent
// on the token value itself — re-registering the same token from the same or
// a different user just refreshes ownership, since tokens are device-bound
// and a device can change hands or reinstall the app under a new account.
export async function registerPushToken(input: PushTokenInputSchema, userId: string): Promise<PushToken> {
  const db = getDb()
  const existing = await db.collection(COLLECTION).where('token', '==', input.token).limit(1).get()
  const now = new Date().toISOString()

  if (!existing.empty) {
    const doc = existing.docs[0]
    await doc.ref.update({ userId, platform: input.platform })
    return toPushToken(doc.id, { ...doc.data(), userId, platform: input.platform })
  }

  const ref = await db.collection(COLLECTION).add({ userId, token: input.token, platform: input.platform, createdAt: now })
  return toPushToken(ref.id, { userId, token: input.token, platform: input.platform, createdAt: now })
}

export async function unregisterPushToken(token: string, userId: string): Promise<boolean> {
  const db = getDb()
  const snap = await db.collection(COLLECTION).where('token', '==', token).where('userId', '==', userId).limit(1).get()
  if (snap.empty) return false
  await snap.docs[0].ref.delete()
  return true
}

export async function listTokensForUser(userId: string): Promise<PushToken[]> {
  const snap = await getDb().collection(COLLECTION).where('userId', '==', userId).get()
  return snap.docs.map((doc) => toPushToken(doc.id, doc.data()))
}
