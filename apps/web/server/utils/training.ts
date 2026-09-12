import type { TrainingCourse } from '~/shared/types/training'
import type { TrainingCourseInputSchema } from '~/shared/validation/training'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'trainingCourses'

function toCourse(id: string, data: FirebaseFirestore.DocumentData): TrainingCourse {
  return {
    id,
    title: data.title ?? '',
    employeeName: data.employeeName ?? '',
    provider: data.provider ?? '',
    status: data.status ?? 'planned',
    startDate: data.startDate ?? null,
    completionDate: data.completionDate ?? null,
    certificateUrl: data.certificateUrl ?? '',
    notes: data.notes ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listTrainingCourses(
  organizationId: string,
  params?: { cursor?: string | null; pageSize?: number },
): Promise<PageResult<TrainingCourse>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toCourse)
}

export async function createTrainingCourse(input: TrainingCourseInputSchema, organizationId: string): Promise<TrainingCourse> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toCourse(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateTrainingCourse(id: string, input: TrainingCourseInputSchema, organizationId: string): Promise<TrainingCourse | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toCourse(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteTrainingCourse(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
