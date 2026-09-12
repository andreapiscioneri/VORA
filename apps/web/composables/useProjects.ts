import type { Project, ProjectInput, ProjectStatus } from '~/shared/types/project'
import type { PageResult } from '~/server/utils/pagination'

export function useProjects() {
  const { $apiFetch } = useNuxtApp()
  const projects = useState<Project[]>('projects', () => [])
  const pending = useState('projects-pending', () => false)
  const loadingMore = useState('projects-loading-more', () => false)
  const error = useState<string | null>('projects-error', () => null)
  const nextCursor = useState<string | null>('projects-cursor', () => null)
  const hasMore = useState('projects-has-more', () => false)

  async function fetchProjects() {
    pending.value = true
    error.value = null
    try {
      const page = await $apiFetch<PageResult<Project>>('/api/projects')
      projects.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'projects.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $apiFetch<PageResult<Project>>('/api/projects', { query: { cursor: nextCursor.value } })
      projects.value = [...projects.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createProject(input: ProjectInput) {
    const created = await $apiFetch<Project>('/api/projects', { method: 'POST', body: input })
    projects.value = [created, ...projects.value]
    return created
  }

  async function updateProject(id: string, input: ProjectInput) {
    const updated = await $apiFetch<Project>(`/api/projects/${id}`, { method: 'PUT', body: input })
    projects.value = projects.value.map((p) => (p.id === id ? updated : p))
    return updated
  }

  async function setStatus(project: Project, status: ProjectStatus) {
    const { id, createdAt, updatedAt, ...input } = project
    await updateProject(id, { ...input, status })
  }

  async function removeProject(id: string) {
    await $apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
    projects.value = projects.value.filter((p) => p.id !== id)
  }

  async function addDocument(projectId: string, title: string, url: string) {
    return await $apiFetch<Project>(`/api/projects/${projectId}/documents`, { method: 'POST', body: { title, url } })
  }

  async function addComment(projectId: string, body: string) {
    return await $apiFetch<Project>(`/api/projects/${projectId}/discussion`, { method: 'POST', body: { body } })
  }

  async function addMilestone(projectId: string, title: string, dueDate: string | null) {
    return await $apiFetch<Project>(`/api/projects/${projectId}/milestones`, { method: 'POST', body: { title, dueDate } })
  }

  async function toggleMilestone(projectId: string, milestoneId: string) {
    return await $apiFetch<Project>(`/api/projects/${projectId}/milestones/${milestoneId}`, { method: 'PUT' })
  }

  return {
    projects,
    pending,
    error,
    hasMore,
    loadingMore,
    fetchProjects,
    loadMore,
    createProject,
    updateProject,
    setStatus,
    removeProject,
    addDocument,
    addComment,
    addMilestone,
    toggleMilestone,
  }
}
