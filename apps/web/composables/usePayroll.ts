import type { PayrollRecord, PayrollRecordInput } from '~/shared/types/payroll'
import type { PageResult } from '~/server/utils/pagination'

export function usePayroll() {
  const { $apiFetch } = useNuxtApp()
  const records = useState<PayrollRecord[]>('payroll-records', () => [])
  const pending = useState('payroll-pending', () => false)
  const loadingMore = useState('payroll-loading-more', () => false)
  const error = useState<string | null>('payroll-error', () => null)
  const nextCursor = useState<string | null>('payroll-cursor', () => null)
  const hasMore = useState('payroll-has-more', () => false)

  async function fetchRecords() {
    pending.value = true
    error.value = null
    try {
      const page = await $apiFetch<PageResult<PayrollRecord>>('/api/payroll')
      records.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'payroll.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $apiFetch<PageResult<PayrollRecord>>('/api/payroll', { query: { cursor: nextCursor.value } })
      records.value = [...records.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createRecord(input: PayrollRecordInput) {
    const created = await $apiFetch<PayrollRecord>('/api/payroll', { method: 'POST', body: input })
    records.value = [created, ...records.value]
    return created
  }

  async function updateRecord(id: string, input: PayrollRecordInput) {
    const updated = await $apiFetch<PayrollRecord>(`/api/payroll/${id}`, { method: 'PUT', body: input })
    records.value = records.value.map((r) => (r.id === id ? updated : r))
    return updated
  }

  async function removeRecord(id: string) {
    await $apiFetch(`/api/payroll/${id}`, { method: 'DELETE' })
    records.value = records.value.filter((r) => r.id !== id)
  }

  return { records, pending, error, hasMore, loadingMore, fetchRecords, loadMore, createRecord, updateRecord, removeRecord }
}
