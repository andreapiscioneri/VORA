import type { Automation } from '~/shared/types/automation'
import type { AutomationInputSchema } from '~/shared/validation/automation'
import { getDb } from './firebase'

const COLLECTION = 'automations'

function toAutomation(id: string, data: FirebaseFirestore.DocumentData): Automation {
  return {
    id,
    name: data.name ?? '',
    active: data.active ?? true,
    trigger: data.trigger ?? { type: 'manual' },
    steps: data.steps ?? [],
    runCount: data.runCount ?? 0,
    lastRunAt: data.lastRunAt ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listAutomations(organizationId: string): Promise<Automation[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toAutomation(doc.id, doc.data())).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
}

/** Active automations for an org matching a trigger type — used to find
 * candidates to run when a contact is created/updated. */
export async function listActiveAutomationsForTrigger(organizationId: string, triggerType: string): Promise<Automation[]> {
  const all = await listAutomations(organizationId)
  return all.filter((a) => a.active && a.trigger.type === triggerType)
}

export async function getAutomation(id: string, organizationId: string): Promise<Automation | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toAutomation(doc.id, doc.data()!)
}

export async function createAutomation(input: AutomationInputSchema, organizationId: string): Promise<Automation> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, runCount: 0, lastRunAt: null, createdAt: now, updatedAt: now })
  return toAutomation(ref.id, { ...input, runCount: 0, lastRunAt: null, createdAt: now, updatedAt: now })
}

export async function updateAutomation(id: string, input: AutomationInputSchema, organizationId: string): Promise<Automation | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toAutomation(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteAutomation(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}

/** Records a completed run: increments runCount and stamps lastRunAt. */
export async function recordAutomationRun(id: string, organizationId: string): Promise<void> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return
  await ref.update({
    runCount: (existing.data()?.runCount ?? 0) + 1,
    lastRunAt: new Date().toISOString(),
  })
}
