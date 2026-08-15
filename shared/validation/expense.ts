import { z } from 'zod'
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES } from '~/shared/types/expense'

export const expenseInputSchema = z.object({
  amount: z.coerce.number().min(0.01, 'validation.required'),
  currency: z.string().trim().length(3).default('EUR'),
  category: z.enum(EXPENSE_CATEGORIES).default('other'),
  date: z.string().min(1, 'validation.required'),
  projectId: z.string().nullable().default(null),
  contactId: z.string().nullable().default(null),
  status: z.enum(EXPENSE_STATUSES).default('pending'),
  notes: z.string().trim().max(2000).default(''),
  receiptUrl: z.string().trim().max(500).default(''),
})

export type ExpenseInputSchema = z.infer<typeof expenseInputSchema>
