import { z } from 'zod'

export const attendanceEntryInputSchema = z.object({
  employeeId: z.string().nullable().default(null),
  employeeName: z.string().trim().min(1, 'validation.required').max(160),
  date: z.string().min(1, 'validation.required'),
  checkIn: z.string().trim().min(1, 'validation.required'),
  checkOut: z.string().trim().default(''),
  notes: z.string().trim().max(2000).default(''),
})

export type AttendanceEntryInputSchema = z.infer<typeof attendanceEntryInputSchema>
