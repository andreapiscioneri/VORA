export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'completed', 'archived'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export interface ChecklistItem {
  id: string
  label: string
  done: boolean
}

export interface TaskAttachment {
  id: string
  title: string
  url: string
  addedAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  deadline: string | null
  tags: string[]
  checklist: ChecklistItem[]
  contactId: string | null
  projectId: string | null
  attachments: TaskAttachment[]
  createdAt: string
  updatedAt: string
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
