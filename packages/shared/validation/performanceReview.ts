import { z } from 'zod'
import { REVIEW_STATUSES } from '../types/performanceReview'

export const performanceReviewInputSchema = z.object({
  employeeId: z.string().nullable().default(null),
  employeeName: z.string().trim().min(1, 'validation.required').max(160),
  period: z.string().trim().min(1, 'validation.required').max(40),
  reviewerName: z.string().trim().max(160).default(''),
  rating: z.coerce.number().min(1).max(5).default(3),
  strengths: z.string().trim().max(2000).default(''),
  improvements: z.string().trim().max(2000).default(''),
  goals: z.string().trim().max(2000).default(''),
  status: z.enum(REVIEW_STATUSES).default('draft'),
  reviewDate: z.string().nullable().default(null),
})

export type PerformanceReviewInputSchema = z.infer<typeof performanceReviewInputSchema>
