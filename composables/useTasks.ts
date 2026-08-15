import type { Task, TaskInput, TaskStatus } from '~/shared/types/task'

export function useTasks() {
  const tasks = useState<Task[]>('tasks', () => [])
  const pending = useState('tasks-pending', () => false)
  const error = useState<string | null>('tasks-error', () => null)

  async function fetchTasks() {
    pending.value = true
    error.value = null
    try {
      tasks.value = await $fetch<Task[]>('/api/tasks')
    } catch {
      error.value = 'tasks.errors.load'
    } finally {
      pending.value = false
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

  return { tasks, pending, error, fetchTasks, createTask, updateTask, setStatus, removeTask, addAttachment }
}
