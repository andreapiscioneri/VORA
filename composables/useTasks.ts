import type { Task, TaskInput, TaskStatus } from '~/shared/types/task'
import type { PageResult } from '~/server/utils/pagination'

export function useTasks() {
  const tasks = useState<Task[]>('tasks', () => [])
  const pending = useState('tasks-pending', () => false)
  const loadingMore = useState('tasks-loading-more', () => false)
  const error = useState<string | null>('tasks-error', () => null)
  const nextCursor = useState<string | null>('tasks-cursor', () => null)
  const hasMore = useState('tasks-has-more', () => false)

  async function fetchTasks() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<Task>>('/api/tasks')
      tasks.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'tasks.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<Task>>('/api/tasks', { query: { cursor: nextCursor.value } })
      tasks.value = [...tasks.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createTask(input: TaskInput) {
    const created = await $fetch<Task>('/api/tasks', { method: 'POST', body: input })
    tasks.value = [created, ...tasks.value]
    return created
  }

  async function updateTask(id: string, input: TaskInput) {
    const updated = await $fetch<Task>(`/api/tasks/${id}`, { method: 'PUT', body: input })
    tasks.value = tasks.value.map((t) => (t.id === id ? updated : t))
    return updated
  }

  async function setStatus(task: Task, status: TaskStatus) {
    const { id, createdAt, updatedAt, ...input } = task
    await updateTask(id, { ...input, status })
  }

  async function removeTask(id: string) {
    await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  async function addAttachment(taskId: string, title: string, url: string) {
    return await $fetch<Task>(`/api/tasks/${taskId}/attachments`, { method: 'POST', body: { title, url } })
  }

  return { tasks, pending, error, hasMore, loadingMore, fetchTasks, loadMore, createTask, updateTask, setStatus, removeTask, addAttachment }
}
