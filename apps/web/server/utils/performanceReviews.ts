import type { PerformanceReview } from '~/shared/types/performanceReview'
import type { PerformanceReviewInputSchema } from '~/shared/validation/performanceReview'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'performanceReviews'

function toReview(id: string, data: FirebaseFirestore.DocumentData): PerformanceReview {
  return {
    id,
    employeeId: data.employeeId ?? null,
    employeeName: data.employeeName ?? '',
    period: data.period ?? '',
    reviewerName: data.reviewerName ?? '',
    rating: data.rating ?? 3,
    strengths: data.strengths ?? '',
    improvements: data.improvements ?? '',
    goals: data.goals ?? '',
    status: data.status ?? 'draft',
    reviewDate: data.reviewDate ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listPerformanceReviews(
  organizationId: string,
  params?: { cursor?: string | null; pageSize?: number },
): Promise<PageResult<PerformanceReview>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toReview)
}

export async function createPerformanceReview(input: PerformanceReviewInputSchema, organizationId: string): Promise<PerformanceReview> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toReview(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updatePerformanceReview(
  id: string,
  input: PerformanceReviewInputSchema,
  organizationId: string,
): Promise<PerformanceReview | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toReview(id, { ...existing.data(), ...input, updatedAt })
}

export async function deletePerformanceReview(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
