import type { Task, TaskAttachment } from '~/shared/types/task'
import type { TaskInputSchema, AddTaskAttachmentSchema } from '~/shared/validation/task'
import { getDb } from './firebase'

const COLLECTION = 'tasks'

function toTask(id: string, data: FirebaseFirestore.DocumentData): Task {
  return {
    id,
    title: data.title ?? '',
    description: data.description ?? '',
    priority: data.priority ?? 'medium',
    status: data.status ?? 'todo',
    deadline: data.deadline ?? null,
    tags: data.tags ?? [],
    checklist: data.checklist ?? [],
    contactId: data.contactId ?? null,
    projectId: data.projectId ?? null,
    attachments: data.attachments ?? [],
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listTasks(organizationId: string): Promise<Task[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toTask(doc.id, doc.data())).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
}

export async function getTask(id: string, organizationId: string): Promise<Task | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toTask(doc.id, doc.data()!)
}

export async function createTask(input: TaskInputSchema, organizationId: string): Promise<Task> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toTask(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateTask(id: string, input: TaskInputSchema, organizationId: string): Promise<Task | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toTask(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteTask(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}

export async function addTaskAttachment(id: string, input: AddTaskAttachmentSchema, organizationId: string): Promise<Task | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const attachment: TaskAttachment = { id: crypto.randomUUID(), title: input.title, url: input.url, addedAt: new Date().toISOString() }
  const attachments = [...(existing.data()?.attachments ?? []), attachment]
  const updatedAt = new Date().toISOString()
  await ref.update({ attachments, updatedAt })
  return toTask(id, { ...existing.data(), attachments, updatedAt })
}
