import { z } from 'zod'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '~/shared/types/ticket'

export const ticketCommentSchema = z.object({
  id: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
  createdAt: z.string(),
})

export const ticketAttachmentSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  url: z.string().trim().url(),
  addedAt: z.string(),
})

export const ticketInputSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  description: z.string().trim().max(4000).default(''),
  contactId: z.string().nullable().default(null),
  priority: z.enum(TICKET_PRIORITIES).default('medium'),
  status: z.enum(TICKET_STATUSES).default('open'),
  category: z.enum(TICKET_CATEGORIES).default('general'),
  slaDueAt: z.string().nullable().default(null),
  comments: z.array(ticketCommentSchema).default([]),
  attachments: z.array(ticketAttachmentSchema).default([]),
})

export type TicketInputSchema = z.infer<typeof ticketInputSchema>

export const addTicketAttachmentSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  url: z.string().trim().url('validation.url'),
})

export type AddTicketAttachmentSchema = z.infer<typeof addTicketAttachmentSchema>
