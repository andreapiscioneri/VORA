import { z } from 'zod'

export const timesheetEntryInputSchema = z.object({
  employeeId: z.string().nullable().default(null),
  employeeName: z.string().trim().max(160).default(''),
  projectId: z.string().nullable().default(null),
  taskId: z.string().nullable().default(null),
  description: z.string().trim().max(400).default(''),
  date: z.string().min(1, 'validation.required'),
  durationMinutes: z.coerce.number().min(1, 'validation.required').max(1440),
  billable: z.boolean().default(true),
})

export type TimesheetEntryInputSchema = z.infer<typeof timesheetEntryInputSchema>
