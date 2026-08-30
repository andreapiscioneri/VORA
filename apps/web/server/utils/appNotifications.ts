import type { AppNotification, NotificationCategory } from '~/shared/types/notification'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'appNotifications'

function toNotification(id: string, data: FirebaseFirestore.DocumentData): AppNotification {
  return {
    id,
    userId: data.userId ?? '',
    category: data.category ?? 'messages',
    title: data.title ?? '',
    body: data.body ?? '',
    data: data.data ?? {},
    read: data.read ?? false,
    createdAt: data.createdAt ?? new Date().toISOString(),
  }
}

export async function createAppNotification(
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<AppNotification> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ userId, category, title, body, data, read: false, createdAt: now })
  return toNotification(ref.id, { userId, category, title, body, data, read: false, createdAt: now })
}

export async function listAppNotifications(
  userId: string,
  params?: { cursor?: string | null; pageSize?: number },
): Promise<PageResult<AppNotification>> {
  const query = getDb().collection(COLLECTION).where('userId', '==', userId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toNotification)
}

export async function countUnreadAppNotifications(userId: string): Promise<number> {
  const snap = await getDb().collection(COLLECTION).where('userId', '==', userId).where('read', '==', false).count().get()
  return snap.data().count
}

export async function markAppNotification(id: string, userId: string, read: boolean): Promise<AppNotification | null> {
  const db = getDb()
  const doc = await db.collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.userId !== userId) return null
  await doc.ref.update({ read })
  return toNotification(id, { ...doc.data(), read })
}

export async function deleteAppNotification(id: string, userId: string): Promise<boolean> {
  const db = getDb()
  const doc = await db.collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.userId !== userId) return false
  await doc.ref.delete()
  return true
}
