import { z } from 'zod'

export const knowledgeDocumentInputSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  content: z.string().trim().max(40000).default(''),
  folder: z.string().trim().max(80).default(''),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  favorite: z.boolean().default(false),
})

export type KnowledgeDocumentInputSchema = z.infer<typeof knowledgeDocumentInputSchema>
