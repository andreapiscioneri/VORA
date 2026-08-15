import { z } from 'zod'
import { CONTACT_STATUSES } from '~/shared/types/contact'

export const segmentFilterSchema = z.object({
  status: z.enum(CONTACT_STATUSES).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
})

export const segmentInputSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(160),
  filter: segmentFilterSchema.default({}),
})

export type SegmentInputSchema = z.infer<typeof segmentInputSchema>
