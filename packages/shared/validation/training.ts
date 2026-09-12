import { z } from 'zod'
import { TRAINING_STATUSES } from '../types/training'

export const trainingCourseInputSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160),
  employeeName: z.string().trim().min(1, 'validation.required').max(160),
  provider: z.string().trim().max(160).default(''),
  status: z.enum(TRAINING_STATUSES).default('planned'),
  startDate: z.string().nullable().default(null),
  completionDate: z.string().nullable().default(null),
  certificateUrl: z.string().trim().max(500).default(''),
  notes: z.string().trim().max(2000).default(''),
})

export type TrainingCourseInputSchema = z.infer<typeof trainingCourseInputSchema>
