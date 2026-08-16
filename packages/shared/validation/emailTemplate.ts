import { z } from 'zod'

export const emailTemplateInputSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(160),
  subject: z.string().trim().min(1, 'validation.required').max(200),
  body: z.string().trim().max(20000).default(''),
})

export type EmailTemplateInputSchema = z.infer<typeof emailTemplateInputSchema>
