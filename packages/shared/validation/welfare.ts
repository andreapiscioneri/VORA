import { z } from 'zod'
import { WELFARE_CATEGORIES, WELFARE_STATUSES } from '../types/welfare'

export const welfareInitiativeInputSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  description: z.string().trim().max(2000).default(''),
  category: z.enum(WELFARE_CATEGORIES).default('other'),
  status: z.enum(WELFARE_STATUSES).default('active'),
  enrolledCount: z.number().int().min(0).default(0),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  notes: z.string().trim().max(2000).default(''),
})

export type WelfareInitiativeInputSchema = z.infer<typeof welfareInitiativeInputSchema>
