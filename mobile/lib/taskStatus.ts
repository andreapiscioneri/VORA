import type { TaskStatus } from '@vora/shared/types/task'

export function nextStatus(status: TaskStatus): TaskStatus {
  if (status === 'todo') return 'in_progress'
  if (status === 'in_progress') return 'review'
  if (status === 'review') return 'completed'
  return status
}
