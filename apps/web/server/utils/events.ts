import type { CalendarEvent } from '~/shared/types/event'
import type { CalendarEventInputSchema } from '~/shared/validation/event'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'events'

function toEvent(id: string, data: FirebaseFirestore.DocumentData): CalendarEvent {
  return {
    id,
    title: data.title ?? '',
    description: data.description ?? '',
    startAt: data.startAt ?? '',
    endAt: data.endAt ?? '',
    allDay: data.allDay ?? false,
    location: data.location ?? '',
    contactId: data.contactId ?? null,
    timezone: data.timezone ?? 'UTC',
    recurrence: data.recurrence ?? { frequency: 'none', interval: 1, until: null },
    createdBy: data.createdBy ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listEvents(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<CalendarEvent>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('startAt', 'asc')
  return paginateQuery(query, COLLECTION, params, toEvent)
}

/** Fetch-all variant for internal callers that rely on the full org list
 * rather than a single page (e.g. AI chat context). */
export async function listAllEvents(organizationId: string): Promise<CalendarEvent[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toEvent(doc.id, doc.data())).sort((a, b) => (a.startAt > b.startAt ? 1 : a.startAt < b.startAt ? -1 : 0))
}

export async function getEvent(id: string, organizationId: string): Promise<CalendarEvent | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toEvent(doc.id, doc.data()!)
}

export async function createCalendarEvent(input: CalendarEventInputSchema, organizationId: string, createdBy: string): Promise<CalendarEvent> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdBy, createdAt: now, updatedAt: now })
  return toEvent(ref.id, { ...input, createdBy, createdAt: now, updatedAt: now })
}

export async function updateEvent(id: string, input: CalendarEventInputSchema, organizationId: string): Promise<CalendarEvent | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toEvent(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteEvent(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
