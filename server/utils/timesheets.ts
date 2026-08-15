import type { TimesheetEntry } from '~/shared/types/timesheet'
import type { TimesheetEntryInputSchema } from '~/shared/validation/timesheet'
import { getDb } from './firebase'

const COLLECTION = 'timesheets'

function toEntry(id: string, data: FirebaseFirestore.DocumentData): TimesheetEntry {
  return {
    id,
    projectId: data.projectId ?? null,
    taskId: data.taskId ?? null,
    description: data.description ?? '',
    date: data.date ?? '',
    durationMinutes: data.durationMinutes ?? 0,
    billable: data.billable ?? true,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listEntries(organizationId: string): Promise<TimesheetEntry[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toEntry(doc.id, doc.data())).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export async function getEntry(id: string, organizationId: string): Promise<TimesheetEntry | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toEntry(doc.id, doc.data()!)
}

export async function createEntry(input: TimesheetEntryInputSchema, organizationId: string): Promise<TimesheetEntry> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toEntry(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateEntry(id: string, input: TimesheetEntryInputSchema, organizationId: string): Promise<TimesheetEntry | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toEntry(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteEntry(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
