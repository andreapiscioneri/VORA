import type { MicroSite } from '~/shared/types/microsite'
import type { MicroSiteInputSchema } from '~/shared/validation/microsite'
import { getDb } from './firebase'

const COLLECTION = 'microsites'

function toSite(id: string, data: FirebaseFirestore.DocumentData): MicroSite {
  return {
    id,
    slug: data.slug ?? '',
    name: data.name ?? '',
    tagline: data.tagline ?? '',
    about: data.about ?? '',
    contactEmail: data.contactEmail ?? '',
    accentColor: data.accentColor ?? '#39FF14',
    published: data.published ?? false,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listSites(organizationId: string): Promise<MicroSite[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toSite(doc.id, doc.data())).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
}

export async function getSite(id: string, organizationId: string): Promise<MicroSite | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toSite(doc.id, doc.data()!)
}

// Public lookups are intentionally NOT organization-scoped: slugs are unique
// across every tenant (they map to a single public URL at /site/<slug>), and
// visitors to a published site are never authenticated.
export async function getSiteBySlug(slug: string): Promise<MicroSite | null> {
  const snapshot = await getDb().collection(COLLECTION).where('slug', '==', slug).limit(1).get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return toSite(doc.id, doc.data())
}

export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await getSiteBySlug(slug)
  if (!existing) return false
  return existing.id !== excludeId
}

export async function createSite(input: MicroSiteInputSchema, organizationId: string): Promise<MicroSite> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toSite(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateSite(id: string, input: MicroSiteInputSchema, organizationId: string): Promise<MicroSite | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toSite(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteSite(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
