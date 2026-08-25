import type { MarketingCampaign } from '~/shared/types/campaign'
import type { MarketingCampaignInputSchema } from '~/shared/validation/campaign'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'campaigns'

function toCampaign(id: string, data: FirebaseFirestore.DocumentData): MarketingCampaign {
  return {
    id,
    name: data.name ?? '',
    subject: data.subject ?? '',
    body: data.body ?? '',
    recipientCount: data.recipientCount ?? 0,
    status: data.status ?? 'draft',
    sentAt: data.sentAt ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listCampaigns(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<MarketingCampaign>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toCampaign)
}

export async function getCampaign(id: string, organizationId: string): Promise<MarketingCampaign | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toCampaign(doc.id, doc.data()!)
}

export async function createCampaign(input: MarketingCampaignInputSchema, organizationId: string): Promise<MarketingCampaign> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toCampaign(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateCampaign(id: string, input: MarketingCampaignInputSchema, organizationId: string): Promise<MarketingCampaign | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toCampaign(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteCampaign(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
