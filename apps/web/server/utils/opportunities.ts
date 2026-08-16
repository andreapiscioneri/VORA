import type { Opportunity } from '~/shared/types/opportunity'
import type { OpportunityInputSchema } from '~/shared/validation/opportunity'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'opportunities'

function toOpportunity(id: string, data: FirebaseFirestore.DocumentData): Opportunity {
  return {
    id,
    title: data.title ?? '',
    contactId: data.contactId ?? null,
    company: data.company ?? '',
    value: data.value ?? 0,
    currency: data.currency ?? 'EUR',
    probability: data.probability ?? 50,
    stage: data.stage ?? 'lead',
    source: data.source ?? 'manual',
    notes: data.notes ?? '',
    expectedCloseDate: data.expectedCloseDate ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listOpportunities(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<Opportunity>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toOpportunity)
}

export async function getOpportunity(id: string, organizationId: string): Promise<Opportunity | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toOpportunity(doc.id, doc.data()!)
}

export async function createOpportunity(input: OpportunityInputSchema, organizationId: string): Promise<Opportunity> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toOpportunity(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateOpportunity(id: string, input: OpportunityInputSchema, organizationId: string): Promise<Opportunity | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toOpportunity(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteOpportunity(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
