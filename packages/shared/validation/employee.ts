import { z } from 'zod'
import { EMPLOYEE_STATUSES } from '../types/employee'

export const employeeInputSchema = z.object({
  firstName: z.string().trim().min(1, 'validation.required').max(80),
  lastName: z.string().trim().min(1, 'validation.required').max(80),
  email: z.union([z.string().trim().email('validation.email'), z.literal('')]).default(''),
  role: z.string().trim().max(120).default(''),
  team: z.string().trim().max(120).default(''),
  status: z.enum(EMPLOYEE_STATUSES).default('active'),
  startDate: z.string().nullable().default(null),
})

export type EmployeeInputSchema = z.infer<typeof employeeInputSchema>
