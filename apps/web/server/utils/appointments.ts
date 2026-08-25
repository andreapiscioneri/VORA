import type { Appointment } from '~/shared/types/appointment'
import type { AppointmentInputSchema } from '~/shared/validation/appointment'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'appointments'

function toAppointment(id: string, data: FirebaseFirestore.DocumentData): Appointment {
  return {
    id,
    title: data.title ?? '',
    contactId: data.contactId ?? null,
    opportunityId: data.opportunityId ?? null,
    startAt: data.startAt ?? '',
    durationMinutes: data.durationMinutes ?? 30,
    location: data.location ?? '',
    videoCallUrl: data.videoCallUrl ?? '',
    notes: data.notes ?? '',
    status: data.status ?? 'scheduled',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listAppointments(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<Appointment>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toAppointment)
}

/** Fetch-all variant for internal callers that rely on the full org list
 * rather than a single page (e.g. global search, AI chat context). */
export async function listAllAppointments(organizationId: string): Promise<Appointment[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toAppointment(doc.id, doc.data())).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
}

export async function getAppointment(id: string, organizationId: string): Promise<Appointment | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toAppointment(doc.id, doc.data()!)
}

export async function createAppointment(input: AppointmentInputSchema, organizationId: string): Promise<Appointment> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toAppointment(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateAppointment(id: string, input: AppointmentInputSchema, organizationId: string): Promise<Appointment | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toAppointment(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteAppointment(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
