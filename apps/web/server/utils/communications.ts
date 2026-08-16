import type { Communication } from '~/shared/types/communication'
import type { CommunicationInputSchema } from '~/shared/validation/communication'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'communications'

function toCommunication(id: string, data: FirebaseFirestore.DocumentData): Communication {
  return {
    id,
    channel: data.channel ?? 'internal',
    direction: data.direction ?? 'outbound',
    contactId: data.contactId ?? null,
    subject: data.subject ?? '',
    body: data.body ?? '',
    status: data.status ?? 'unread',
    sentAt: data.sentAt ?? new Date().toISOString(),
    threadId: data.threadId ?? null,
    labels: data.labels ?? [],
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listCommunications(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<Communication>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('sentAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toCommunication)
}

/** Fetch-all variant for internal callers that rely on the full org list
 * rather than a single page (e.g. cross-module search, AI chat context). */
export async function listAllCommunications(organizationId: string): Promise<Communication[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toCommunication(doc.id, doc.data())).sort((a, b) => (a.sentAt < b.sentAt ? 1 : a.sentAt > b.sentAt ? -1 : 0))
}

export async function getCommunication(id: string, organizationId: string): Promise<Communication | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toCommunication(doc.id, doc.data()!)
}

export async function createCommunication(input: CommunicationInputSchema, organizationId: string): Promise<Communication> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toCommunication(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateCommunication(
  id: string,
  patch: Partial<CommunicationInputSchema>,
  organizationId: string,
): Promise<Communication | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...patch, updatedAt })
  return toCommunication(id, { ...existing.data(), ...patch, updatedAt })
}

export async function deleteCommunication(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
