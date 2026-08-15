import { z } from 'zod'
import { OPPORTUNITY_SOURCES, OPPORTUNITY_STAGES } from '~/shared/types/opportunity'

export const opportunityInputSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  contactId: z.string().nullable().default(null),
  company: z.string().trim().max(120).default(''),
  value: z.coerce.number().min(0).default(0),
  currency: z.string().trim().length(3).default('EUR'),
  probability: z.coerce.number().min(0).max(100).default(50),
  stage: z.enum(OPPORTUNITY_STAGES).default('lead'),
  source: z.enum(OPPORTUNITY_SOURCES).default('manual'),
  notes: z.string().trim().max(4000).default(''),
  expectedCloseDate: z.string().nullable().default(null),
})

export type OpportunityInputSchema = z.infer<typeof opportunityInputSchema>
