import type { Expense, ExpenseInput, ExpenseStatus } from '~/shared/types/expense'
import type { PageResult } from '~/server/utils/pagination'

export function useExpenses() {
  const expenses = useState<Expense[]>('expenses', () => [])
  const pending = useState('expenses-pending', () => false)
  const loadingMore = useState('expenses-loading-more', () => false)
  const error = useState<string | null>('expenses-error', () => null)
  const nextCursor = useState<string | null>('expenses-cursor', () => null)
  const hasMore = useState('expenses-has-more', () => false)

  async function fetchExpenses() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<Expense>>('/api/expenses')
      expenses.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'expenses.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<Expense>>('/api/expenses', { query: { cursor: nextCursor.value } })
      expenses.value = [...expenses.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createExpense(input: ExpenseInput) {
    const created = await $fetch<Expense>('/api/expenses', { method: 'POST', body: input })
    expenses.value = [created, ...expenses.value]
    return created
  }

  async function updateExpense(id: string, input: ExpenseInput) {
    const updated = await $fetch<Expense>(`/api/expenses/${id}`, { method: 'PUT', body: input })
    expenses.value = expenses.value.map((e) => (e.id === id ? updated : e))
    return updated
  }

  async function setStatus(expense: Expense, status: ExpenseStatus) {
    const { id, createdAt, updatedAt, ...input } = expense
    return await updateExpense(id, { ...input, status })
  }

  async function removeExpense(id: string) {
    await $fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    expenses.value = expenses.value.filter((e) => e.id !== id)
  }

  return { expenses, pending, error, hasMore, loadingMore, fetchExpenses, loadMore, createExpense, updateExpense, setStatus, removeExpense }
}
