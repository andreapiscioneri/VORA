import type { Contact, ContactAttachment } from '~/shared/types/contact'
import type { ContactInputSchema, AddContactAttachmentSchema } from '~/shared/validation/contact'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'contacts'

function toContact(id: string, data: FirebaseFirestore.DocumentData): Contact {
  return {
    id,
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    company: data.company ?? '',
    role: data.role ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    whatsapp: data.whatsapp ?? '',
    website: data.website ?? '',
    address: data.address ?? '',
    notes: data.notes ?? '',
    tags: data.tags ?? [],
    status: data.status ?? 'lead',
    source: data.source ?? 'manual',
    lastContactAt: data.lastContactAt ?? null,
    nextActivityAt: data.nextActivityAt ?? null,
    attachments: data.attachments ?? [],
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listContacts(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<Contact>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toContact)
}

/** Fetch-all variant for internal callers that rely on the full org list
 * rather than a single page (e.g. cross-module search, segment resolution). */
export async function listAllContacts(organizationId: string): Promise<Contact[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs
    .map((doc) => toContact(doc.id, doc.data()))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function getContact(id: string, organizationId: string): Promise<Contact | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toContact(doc.id, doc.data()!)
}

export async function createContact(input: ContactInputSchema, organizationId: string): Promise<Contact> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toContact(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateContact(id: string, input: ContactInputSchema, organizationId: string): Promise<Contact | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toContact(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteContact(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}

export async function addContactAttachment(id: string, input: AddContactAttachmentSchema, organizationId: string): Promise<Contact | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const attachment: ContactAttachment = { id: crypto.randomUUID(), title: input.title, url: input.url, addedAt: new Date().toISOString() }
  const attachments = [...(existing.data()?.attachments ?? []), attachment]
  const updatedAt = new Date().toISOString()
  await ref.update({ attachments, updatedAt })
  return toContact(id, { ...existing.data(), attachments, updatedAt })
}
