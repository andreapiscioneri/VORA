import type { Contact } from '~/shared/types/contact'
import type { Segment } from '~/shared/types/segment'
import type { SegmentInputSchema } from '~/shared/validation/segment'
import { getDb } from './firebase'
import { listContacts } from './contacts'

const COLLECTION = 'segments'

function toSegment(id: string, data: FirebaseFirestore.DocumentData): Segment {
  return {
    id,
    name: data.name ?? '',
    filter: {
      status: data.filter?.status,
      tags: data.filter?.tags ?? [],
    },
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listSegments(organizationId: string): Promise<Segment[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toSegment(doc.id, doc.data())).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
}

export async function getSegment(id: string, organizationId: string): Promise<Segment | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toSegment(doc.id, doc.data()!)
}

export async function createSegment(input: SegmentInputSchema, organizationId: string): Promise<Segment> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toSegment(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateSegment(id: string, input: SegmentInputSchema, organizationId: string): Promise<Segment | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toSegment(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteSegment(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}

/** Resolves a segment's saved filter criteria against the org's real contacts.
 * Used to derive a genuine recipient list/count for campaigns instead of a
 * manually-typed estimate. */
export async function resolveSegment(segment: Pick<Segment, 'filter'>, organizationId: string): Promise<Contact[]> {
  const contacts = await listContacts(organizationId)
  return contacts.filter((contact) => {
    if (segment.filter.status && contact.status !== segment.filter.status) return false
    if (segment.filter.tags && segment.filter.tags.length > 0) {
      const hasAllTags = segment.filter.tags.every((tag) => contact.tags.includes(tag))
      if (!hasAllTags) return false
    }
    return true
  })
}
