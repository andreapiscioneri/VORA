import { z } from 'zod'
import { CAMPAIGN_STATUSES } from '~/shared/types/campaign'

export const campaignInputSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(160),
  subject: z.string().trim().min(1, 'validation.required').max(200),
  body: z.string().trim().max(20000).default(''),
  recipientCount: z.coerce.number().min(0).default(0),
  status: z.enum(CAMPAIGN_STATUSES).default('draft'),
  sentAt: z.string().nullable().default(null),
})

export type MarketingCampaignInputSchema = z.infer<typeof campaignInputSchema>
