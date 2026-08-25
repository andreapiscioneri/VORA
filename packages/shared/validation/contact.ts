import { z } from 'zod'
import { CONTACT_SOURCES, CONTACT_STATUSES } from '~/shared/types/contact'
import { isValidPhone } from './phone'

// Empty stays valid — both fields are optional — but a non-empty value
// must look like a real phone number (loose E.164 check, see phone.ts).
const phoneField = z.string().trim().max(40).default('').refine((v) => v === '' || isValidPhone(v), 'validation.phone')

export const contactAttachmentSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  url: z.string().trim().url(),
  addedAt: z.string(),
})

export const contactInputSchema = z.object({
  firstName: z.string().trim().min(1, 'validation.required').max(80),
  lastName: z.string().trim().min(1, 'validation.required').max(80),
  company: z.string().trim().max(120).default(''),
  role: z.string().trim().max(120).default(''),
  email: z.union([z.string().trim().email('validation.email'), z.literal('')]).default(''),
  phone: phoneField,
  whatsapp: phoneField,
  website: z.string().trim().max(200).default(''),
  address: z.string().trim().max(240).default(''),
  notes: z.string().trim().max(4000).default(''),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  status: z.enum(CONTACT_STATUSES).default('lead'),
  source: z.enum(CONTACT_SOURCES).default('manual'),
  lastContactAt: z.string().nullable().default(null),
  nextActivityAt: z.string().nullable().default(null),
  attachments: z.array(contactAttachmentSchema).default([]),
})

export type ContactInputSchema = z.infer<typeof contactInputSchema>

export const addContactAttachmentSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  url: z.string().trim().url('validation.url'),
})

export type AddContactAttachmentSchema = z.infer<typeof addContactAttachmentSchema>
