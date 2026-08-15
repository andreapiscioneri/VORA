import { z } from 'zod'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const microSiteInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'validation.required')
    .max(60)
    .regex(SLUG, 'validation.slug'),
  name: z.string().trim().min(1, 'validation.required').max(120),
  tagline: z.string().trim().max(200).default(''),
  about: z.string().trim().max(4000).default(''),
  contactEmail: z.union([z.string().trim().email('validation.email'), z.literal('')]).default(''),
  accentColor: z.string().trim().regex(HEX_COLOR, 'validation.color').default('#39FF14'),
  published: z.boolean().default(false),
})

export type MicroSiteInputSchema = z.infer<typeof microSiteInputSchema>
