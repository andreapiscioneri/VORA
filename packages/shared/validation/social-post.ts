import { z } from 'zod'
import { SOCIAL_PLATFORMS, SOCIAL_POST_STATUSES } from '../types/social-post'

export const socialPostInputSchema = z.object({
  content: z.string().trim().min(1, 'validation.required').max(2000),
  platform: z.enum(SOCIAL_PLATFORMS).default('instagram'),
  status: z.enum(SOCIAL_POST_STATUSES).default('draft'),
  scheduledAt: z.string().nullable().default(null),
})

export type SocialPostInputSchema = z.infer<typeof socialPostInputSchema>
