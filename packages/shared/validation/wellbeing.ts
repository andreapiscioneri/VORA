import { z } from 'zod'
import { WELLBEING_SCALE } from '~/shared/types/wellbeing'

const scale = z.union(WELLBEING_SCALE.map((v) => z.literal(v)) as [z.ZodLiteral<number>, ...z.ZodLiteral<number>[]])

export const wellbeingCheckInInputSchema = z.object({
  date: z.string().min(1, 'validation.required'),
  mood: scale,
  energy: scale,
  stress: scale,
  note: z.string().trim().max(1000).default(''),
})

export type WellbeingCheckInInputSchema = z.infer<typeof wellbeingCheckInInputSchema>
