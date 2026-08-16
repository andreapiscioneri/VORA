import { z } from 'zod'
import { LEAVE_STATUSES, LEAVE_TYPES } from '~/shared/types/leave'

export const leaveRequestInputSchema = z
  .object({
    requesterName: z.string().trim().min(1, 'validation.required').max(160),
    type: z.enum(LEAVE_TYPES).default('vacation'),
    startDate: z.string().min(1, 'validation.required'),
    endDate: z.string().min(1, 'validation.required'),
    status: z.enum(LEAVE_STATUSES).default('pending'),
    notes: z.string().trim().max(2000).default(''),
  })
  .refine((data) => new Date(data.endDate).getTime() >= new Date(data.startDate).getTime(), {
    message: 'validation.endBeforeStart',
    path: ['endDate'],
  })

export type LeaveRequestInputSchema = z.infer<typeof leaveRequestInputSchema>
