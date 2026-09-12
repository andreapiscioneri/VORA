import type { WelfareInitiative } from '~/shared/types/welfare'
import type { WelfareInitiativeInputSchema } from '~/shared/validation/welfare'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'welfareInitiatives'

function toInitiative(id: string, data: FirebaseFirestore.DocumentData): WelfareInitiative {
  return {
    id,
    title: data.title ?? '',
    description: data.description ?? '',
    category: data.category ?? 'other',
    status: data.status ?? 'active',
    enrolledCount: data.enrolledCount ?? 0,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    notes: data.notes ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listWelfareInitiatives(
  organizationId: string,
  params?: { cursor?: string | null; pageSize?: number },
): Promise<PageResult<WelfareInitiative>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toInitiative)
}

export async function createWelfareInitiative(input: WelfareInitiativeInputSchema, organizationId: string): Promise<WelfareInitiative> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toInitiative(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateWelfareInitiative(
  id: string,
  input: WelfareInitiativeInputSchema,
  organizationId: string,
): Promise<WelfareInitiative | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toInitiative(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteWelfareInitiative(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
