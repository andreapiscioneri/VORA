import { z } from 'zod'
import { TASK_PRIORITIES, TASK_STATUSES } from '~/shared/types/task'

export const checklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(200),
  done: z.boolean().default(false),
})

export const taskAttachmentSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  url: z.string().trim().url(),
  addedAt: z.string(),
})

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  description: z.string().trim().max(4000).default(''),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  status: z.enum(TASK_STATUSES).default('todo'),
  deadline: z.string().nullable().default(null),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  checklist: z.array(checklistItemSchema).default([]),
  contactId: z.string().nullable().default(null),
  projectId: z.string().nullable().default(null),
  attachments: z.array(taskAttachmentSchema).default([]),
})

export type TaskInputSchema = z.infer<typeof taskInputSchema>

export const addTaskAttachmentSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  url: z.string().trim().url('validation.url'),
})

export type AddTaskAttachmentSchema = z.infer<typeof addTaskAttachmentSchema>
