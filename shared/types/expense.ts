export const EXPENSE_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number]

export const EXPENSE_CATEGORIES = ['travel', 'meals', 'office', 'software', 'other'] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface Expense {
  id: string
  amount: number
  currency: string
  category: ExpenseCategory
  date: string
  projectId: string | null
  contactId: string | null
  status: ExpenseStatus
  notes: string
  receiptUrl: string
  createdAt: string
  updatedAt: string
}

export type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
