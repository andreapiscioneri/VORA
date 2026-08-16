export const TICKET_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

export const TICKET_CATEGORIES = ['technical', 'billing', 'general', 'feature_request'] as const
export type TicketCategory = (typeof TICKET_CATEGORIES)[number]

export interface TicketComment {
  id: string
  body: string
  createdAt: string
}

export interface TicketAttachment {
  id: string
  title: string
  url: string
  addedAt: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  contactId: string | null
  priority: TicketPriority
  status: TicketStatus
  category: TicketCategory
  slaDueAt: string | null
  comments: TicketComment[]
  attachments: TicketAttachment[]
  createdAt: string
  updatedAt: string
}

export type TicketInput = Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>
