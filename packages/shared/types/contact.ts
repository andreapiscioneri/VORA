export const CONTACT_STATUSES = ['active', 'lead', 'inactive'] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export const CONTACT_SOURCES = ['manual', 'website', 'referral', 'email', 'whatsapp', 'import'] as const
export type ContactSource = (typeof CONTACT_SOURCES)[number]

export interface ContactAttachment {
  id: string
  title: string
  url: string
  addedAt: string
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  company: string
  role: string
  email: string
  phone: string
  whatsapp: string
  website: string
  address: string
  notes: string
  tags: string[]
  status: ContactStatus
  source: ContactSource
  lastContactAt: string | null
  nextActivityAt: string | null
  attachments: ContactAttachment[]
  createdAt: string
  updatedAt: string
}

export type ContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>
