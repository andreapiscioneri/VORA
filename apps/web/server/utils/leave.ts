import type { LeaveRequest } from '~/shared/types/leave'
import type { LeaveRequestInputSchema } from '~/shared/validation/leave'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'leaveRequests'

function toLeaveRequest(id: string, data: FirebaseFirestore.DocumentData): LeaveRequest {
  return {
    id,
    requesterName: data.requesterName ?? '',
    type: data.type ?? 'vacation',
    startDate: data.startDate ?? '',
    endDate: data.endDate ?? '',
    status: data.status ?? 'pending',
    notes: data.notes ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listLeaveRequests(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<LeaveRequest>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toLeaveRequest)
}

// Used only for the annual balance widget (server/api/leave-requests/all.get.ts)
// — that computation needs every request for the current year, which cursor
// pagination can't give a client without walking every page itself.
export async function listAllLeaveRequests(organizationId: string): Promise<LeaveRequest[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toLeaveRequest(doc.id, doc.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getLeaveRequest(id: string, organizationId: string): Promise<LeaveRequest | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toLeaveRequest(doc.id, doc.data()!)
}

export async function createLeaveRequest(input: LeaveRequestInputSchema, organizationId: string): Promise<LeaveRequest> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toLeaveRequest(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateLeaveRequest(id: string, input: LeaveRequestInputSchema, organizationId: string): Promise<LeaveRequest | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toLeaveRequest(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteLeaveRequest(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
