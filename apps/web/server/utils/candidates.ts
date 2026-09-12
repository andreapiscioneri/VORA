import type { Candidate } from '~/shared/types/candidate'
import type { CandidateInputSchema } from '~/shared/validation/candidate'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'candidates'

function toCandidate(id: string, data: FirebaseFirestore.DocumentData): Candidate {
  return {
    id,
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    role: data.role ?? '',
    stage: data.stage ?? 'applied',
    source: data.source ?? 'other',
    resumeUrl: data.resumeUrl ?? '',
    notes: data.notes ?? '',
    interviewDate: data.interviewDate ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listCandidates(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<Candidate>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toCandidate)
}

export async function createCandidate(input: CandidateInputSchema, organizationId: string): Promise<Candidate> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toCandidate(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateCandidate(id: string, input: CandidateInputSchema, organizationId: string): Promise<Candidate | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toCandidate(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteCandidate(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
