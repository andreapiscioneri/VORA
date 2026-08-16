import { z } from 'zod'
import { APPOINTMENT_STATUSES } from '~/shared/types/appointment'

export const appointmentInputSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  contactId: z.string().nullable().default(null),
  opportunityId: z.string().nullable().default(null),
  startAt: z.string().min(1, 'validation.required'),
  durationMinutes: z.coerce.number().min(5).max(1440).default(30),
  location: z.string().trim().max(200).default(''),
  videoCallUrl: z.union([z.string().trim().url('validation.url'), z.literal('')]).default(''),
  notes: z.string().trim().max(4000).default(''),
  status: z.enum(APPOINTMENT_STATUSES).default('scheduled'),
})

export type AppointmentInputSchema = z.infer<typeof appointmentInputSchema>
