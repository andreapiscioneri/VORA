import { z } from 'zod'
import { PROJECT_STATUSES } from '~/shared/types/project'

export const projectDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  url: z.string().trim().url(),
  addedAt: z.string(),
})

export const projectCommentSchema = z.object({
  id: z.string().min(1),
  authorName: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(2000),
  createdAt: z.string(),
})

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(160),
  description: z.string().trim().max(4000).default(''),
  status: z.enum(PROJECT_STATUSES).default('active'),
  contactId: z.string().nullable().default(null),
  startDate: z.string().nullable().default(null),
  dueDate: z.string().nullable().default(null),
  budget: z.coerce.number().min(0).default(0),
  documents: z.array(projectDocumentSchema).default([]),
  discussion: z.array(projectCommentSchema).default([]),
})

export type ProjectInputSchema = z.infer<typeof projectInputSchema>

export const addProjectDocumentSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  url: z.string().trim().url('validation.url'),
})

export type AddProjectDocumentSchema = z.infer<typeof addProjectDocumentSchema>

export const addProjectCommentSchema = z.object({
  body: z.string().trim().min(1, 'validation.required').max(2000),
})

export type AddProjectCommentSchema = z.infer<typeof addProjectCommentSchema>
