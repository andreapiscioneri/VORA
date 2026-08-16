import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences } from '~/shared/types/notification'
import type { NotificationPreferencesSchema } from '~/shared/validation/notification'
import { getDb } from './firebase'

const COLLECTION = 'notificationPreferences'

// One document per user, keyed by userId as the document ID directly (no
// separate lookup needed, and it makes "does this user have prefs yet"
// a single get-by-id instead of a query).
export async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const doc = await getDb().collection(COLLECTION).doc(userId).get()
  if (!doc.exists) return DEFAULT_NOTIFICATION_PREFERENCES
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...doc.data() }
}

export async function setPreferences(userId: string, input: NotificationPreferencesSchema): Promise<NotificationPreferences> {
  await getDb().collection(COLLECTION).doc(userId).set(input)
  return input
}
