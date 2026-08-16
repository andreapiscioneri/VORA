import type { Ticket, TicketAttachment } from '~/shared/types/ticket'
import type { TicketInputSchema, AddTicketAttachmentSchema } from '~/shared/validation/ticket'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'tickets'

function toTicket(id: string, data: FirebaseFirestore.DocumentData): Ticket {
  return {
    id,
    title: data.title ?? '',
    description: data.description ?? '',
    contactId: data.contactId ?? null,
    priority: data.priority ?? 'medium',
    status: data.status ?? 'open',
    category: data.category ?? 'general',
    slaDueAt: data.slaDueAt ?? null,
    comments: data.comments ?? [],
    attachments: data.attachments ?? [],
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listTickets(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<Ticket>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toTicket)
}

/** Fetch-all variant for internal callers that rely on the full org list
 * rather than a single page (e.g. cross-module search). */
export async function listAllTickets(organizationId: string): Promise<Ticket[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toTicket(doc.id, doc.data())).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
}

export async function getTicket(id: string, organizationId: string): Promise<Ticket | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toTicket(doc.id, doc.data()!)
}

export async function createTicket(input: TicketInputSchema, organizationId: string): Promise<Ticket> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toTicket(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateTicket(id: string, input: TicketInputSchema, organizationId: string): Promise<Ticket | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toTicket(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteTicket(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}

export async function addTicketAttachment(id: string, input: AddTicketAttachmentSchema, organizationId: string): Promise<Ticket | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const attachment: TicketAttachment = { id: crypto.randomUUID(), title: input.title, url: input.url, addedAt: new Date().toISOString() }
  const attachments = [...(existing.data()?.attachments ?? []), attachment]
  const updatedAt = new Date().toISOString()
  await ref.update({ attachments, updatedAt })
  return toTicket(id, { ...existing.data(), attachments, updatedAt })
}
