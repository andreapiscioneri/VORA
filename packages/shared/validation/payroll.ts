import { z } from 'zod'
import { PAYROLL_STATUSES } from '../types/payroll'

export const payrollRecordInputSchema = z.object({
  employeeName: z.string().trim().min(1, 'validation.required').max(160),
  period: z.string().trim().min(1, 'validation.required').max(20),
  grossAmount: z.number().min(0).default(0),
  netAmount: z.number().min(0).default(0),
  status: z.enum(PAYROLL_STATUSES).default('draft'),
  payslipUrl: z.string().trim().max(500).default(''),
  paidAt: z.string().nullable().default(null),
  notes: z.string().trim().max(2000).default(''),
})

export type PayrollRecordInputSchema = z.infer<typeof payrollRecordInputSchema>
