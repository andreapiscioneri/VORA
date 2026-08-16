import type { WellbeingCheckIn } from '~/shared/types/wellbeing'
import type { WellbeingCheckInInputSchema } from '~/shared/validation/wellbeing'
import { getDb } from './firebase'

const COLLECTION = 'wellbeingCheckIns'

function toCheckIn(id: string, data: FirebaseFirestore.DocumentData): WellbeingCheckIn {
  return {
    id,
    userId: data.userId ?? '',
    date: data.date ?? '',
    mood: data.mood ?? 3,
    energy: data.energy ?? 3,
    stress: data.stress ?? 3,
    note: data.note ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

// Wellbeing check-ins are personal, not organization-shared: scoped by both
// organizationId (tenant isolation, same as every other module) AND userId
// (so colleagues in the same organization cannot see each other's entries).
export async function listCheckIns(organizationId: string, userId: string): Promise<WellbeingCheckIn[]> {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where('organizationId', '==', organizationId)
    .where('userId', '==', userId)
    .get()
  return snapshot.docs
    .map((doc) => toCheckIn(doc.id, doc.data()))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

// One check-in per user per day: create() first checks for an existing entry
// on that date and updates it in place instead of allowing duplicates.
export async function upsertCheckIn(
  input: WellbeingCheckInInputSchema,
  organizationId: string,
  userId: string
): Promise<WellbeingCheckIn> {
  const db = getDb()
  const existing = await db
    .collection(COLLECTION)
    .where('organizationId', '==', organizationId)
    .where('userId', '==', userId)
    .where('date', '==', input.date)
    .limit(1)
    .get()

  const now = new Date().toISOString()

  if (!existing.empty) {
    const doc = existing.docs[0]
    await doc.ref.update({ ...input, updatedAt: now })
    return toCheckIn(doc.id, { ...doc.data(), ...input, updatedAt: now })
  }

  const ref = await db.collection(COLLECTION).add({ ...input, organizationId, userId, createdAt: now, updatedAt: now })
  return toCheckIn(ref.id, { ...input, userId, createdAt: now, updatedAt: now })
}

export async function deleteCheckIn(id: string, organizationId: string, userId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId || existing.data()?.userId !== userId) {
    return false
  }
  await ref.delete()
  return true
}
