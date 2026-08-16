import { z } from 'zod'
import { RECURRENCE_FREQUENCIES } from '~/shared/types/event'

export const eventRecurrenceSchema = z.object({
  frequency: z.enum(RECURRENCE_FREQUENCIES).default('none'),
  interval: z.coerce.number().int().min(1).max(365).default(1),
  until: z.string().nullable().default(null),
})

export const calendarEventInputSchema = z
  .object({
    title: z.string().trim().min(1, 'validation.required').max(160),
    description: z.string().trim().max(4000).default(''),
    startAt: z.string().min(1, 'validation.required'),
    endAt: z.string().min(1, 'validation.required'),
    allDay: z.boolean().default(false),
    location: z.string().trim().max(200).default(''),
    contactId: z.string().nullable().default(null),
    timezone: z.string().trim().min(1).default('UTC'),
    recurrence: eventRecurrenceSchema.default({ frequency: 'none', interval: 1, until: null }),
  })
  .refine((data) => new Date(data.endAt).getTime() >= new Date(data.startAt).getTime(), {
    message: 'validation.endBeforeStart',
    path: ['endAt'],
  })
  .refine((data) => data.recurrence.frequency === 'none' || !data.recurrence.until || new Date(data.recurrence.until).getTime() >= new Date(data.startAt).getTime(), {
    message: 'validation.recurrenceUntilBeforeStart',
    path: ['until'],
  })

export type CalendarEventInputSchema = z.infer<typeof calendarEventInputSchema>
