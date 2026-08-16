import type { Project, ProjectDocument, ProjectComment, ProjectMilestone } from '~/shared/types/project'
import type { ProjectInputSchema, AddProjectDocumentSchema, AddProjectCommentSchema, AddProjectMilestoneSchema } from '~/shared/validation/project'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'projects'

function toProject(id: string, data: FirebaseFirestore.DocumentData): Project {
  return {
    id,
    name: data.name ?? '',
    description: data.description ?? '',
    status: data.status ?? 'active',
    contactId: data.contactId ?? null,
    startDate: data.startDate ?? null,
    dueDate: data.dueDate ?? null,
    budget: data.budget ?? 0,
    documents: data.documents ?? [],
    discussion: data.discussion ?? [],
    milestones: data.milestones ?? [],
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listProjects(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<Project>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toProject)
}

/** Fetch-all variant for internal callers that rely on the full org list
 * rather than a single page (e.g. cross-module search). */
export async function listAllProjects(organizationId: string): Promise<Project[]> {
  const snapshot = await getDb().collection(COLLECTION).where('organizationId', '==', organizationId).get()
  return snapshot.docs.map((doc) => toProject(doc.id, doc.data())).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
}

export async function getProject(id: string, organizationId: string): Promise<Project | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toProject(doc.id, doc.data()!)
}

export async function createProject(input: ProjectInputSchema, organizationId: string): Promise<Project> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toProject(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateProject(id: string, input: ProjectInputSchema, organizationId: string): Promise<Project | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toProject(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteProject(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}

export async function addProjectDocument(id: string, input: AddProjectDocumentSchema, organizationId: string): Promise<Project | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const document: ProjectDocument = { id: crypto.randomUUID(), title: input.title, url: input.url, addedAt: new Date().toISOString() }
  const documents = [...(existing.data()?.documents ?? []), document]
  const updatedAt = new Date().toISOString()
  await ref.update({ documents, updatedAt })
  return toProject(id, { ...existing.data(), documents, updatedAt })
}

export async function addProjectComment(id: string, input: AddProjectCommentSchema, authorName: string, organizationId: string): Promise<Project | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const comment: ProjectComment = { id: crypto.randomUUID(), authorName, body: input.body, createdAt: new Date().toISOString() }
  const discussion = [...(existing.data()?.discussion ?? []), comment]
  const updatedAt = new Date().toISOString()
  await ref.update({ discussion, updatedAt })
  return toProject(id, { ...existing.data(), discussion, updatedAt })
}

export async function addProjectMilestone(id: string, input: AddProjectMilestoneSchema, organizationId: string): Promise<Project | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const milestone: ProjectMilestone = {
    id: crypto.randomUUID(),
    title: input.title,
    dueDate: input.dueDate ?? null,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  const milestones = [...(existing.data()?.milestones ?? []), milestone]
  const updatedAt = new Date().toISOString()
  await ref.update({ milestones, updatedAt })
  return toProject(id, { ...existing.data(), milestones, updatedAt })
}

export async function toggleProjectMilestone(id: string, milestoneId: string, organizationId: string): Promise<Project | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const milestones: ProjectMilestone[] = (existing.data()?.milestones ?? []).map((m: ProjectMilestone) =>
    m.id === milestoneId ? { ...m, status: m.status === 'completed' ? 'pending' : 'completed' } : m,
  )
  const updatedAt = new Date().toISOString()
  await ref.update({ milestones, updatedAt })
  return toProject(id, { ...existing.data(), milestones, updatedAt })
}
