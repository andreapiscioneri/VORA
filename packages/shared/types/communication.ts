export const COMMUNICATION_CHANNELS = ['email', 'whatsapp', 'internal'] as const
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number]

export const COMMUNICATION_DIRECTIONS = ['inbound', 'outbound'] as const
export type CommunicationDirection = (typeof COMMUNICATION_DIRECTIONS)[number]

export const COMMUNICATION_STATUSES = ['unread', 'read', 'archived'] as const
export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number]

export interface Communication {
  id: string
  channel: CommunicationChannel
  direction: CommunicationDirection
  contactId: string | null
  subject: string
  body: string
  status: CommunicationStatus
  sentAt: string
  /** Groups a reply chain together. Null means "not explicitly threaded" — the UI then treats the message as the sole member of its own thread (keyed by its own id). Set when a message is sent as a reply to another (inherits the original's threadId, or that message's id if it had none yet). */
  threadId: string | null
  /** Freeform user-assigned labels (e.g. "cliente-vip", "da-seguire") — not a fixed taxonomy. */
  labels: string[]
  createdAt: string
  updatedAt: string
}

export type CommunicationInput = Omit<Communication, 'id' | 'createdAt' | 'updatedAt'>
