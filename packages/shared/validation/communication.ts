import { z } from 'zod'
import { COMMUNICATION_CHANNELS, COMMUNICATION_DIRECTIONS, COMMUNICATION_STATUSES } from '~/shared/types/communication'

export const communicationInputSchema = z.object({
  channel: z.enum(COMMUNICATION_CHANNELS),
  direction: z.enum(COMMUNICATION_DIRECTIONS).default('outbound'),
  contactId: z.string().nullable().default(null),
  subject: z.string().trim().max(200).default(''),
  body: z.string().trim().min(1, 'validation.required').max(8000),
  status: z.enum(COMMUNICATION_STATUSES).default('unread'),
  sentAt: z.string().default(() => new Date().toISOString()),
  threadId: z.string().nullable().default(null),
  labels: z.array(z.string().trim().min(1).max(40)).default([]),
})

export type CommunicationInputSchema = z.infer<typeof communicationInputSchema>
