import type { AttendanceEntry } from '~/shared/types/attendance'
import type { AttendanceEntryInputSchema } from '~/shared/validation/attendance'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'attendance'

function toEntry(id: string, data: FirebaseFirestore.DocumentData): AttendanceEntry {
  return {
    id,
    employeeId: data.employeeId ?? null,
    employeeName: data.employeeName ?? '',
    date: data.date ?? '',
    checkIn: data.checkIn ?? '',
    checkOut: data.checkOut ?? '',
    notes: data.notes ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listAttendance(
  organizationId: string,
  params?: { cursor?: string | null; pageSize?: number },
): Promise<PageResult<AttendanceEntry>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('date', 'desc')
  return paginateQuery(query, COLLECTION, params, toEntry)
}

export async function createAttendanceEntry(input: AttendanceEntryInputSchema, organizationId: string): Promise<AttendanceEntry> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toEntry(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateAttendanceEntry(id: string, input: AttendanceEntryInputSchema, organizationId: string): Promise<AttendanceEntry | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toEntry(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteAttendanceEntry(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
