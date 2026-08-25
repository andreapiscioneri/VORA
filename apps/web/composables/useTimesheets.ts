import type { TimesheetEntry, TimesheetEntryInput } from '~/shared/types/timesheet'
import type { PageResult } from '~/server/utils/pagination'

export function useTimesheets() {
  const entries = useState<TimesheetEntry[]>('timesheets', () => [])
  const pending = useState('timesheets-pending', () => false)
  const loadingMore = useState('timesheets-loading-more', () => false)
  const error = useState<string | null>('timesheets-error', () => null)
  const nextCursor = useState<string | null>('timesheets-cursor', () => null)
  const hasMore = useState('timesheets-has-more', () => false)

  async function fetchEntries() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<TimesheetEntry>>('/api/timesheets')
      entries.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'timesheets.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<TimesheetEntry>>('/api/timesheets', { query: { cursor: nextCursor.value } })
      entries.value = [...entries.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createEntry(input: TimesheetEntryInput) {
    const created = await $fetch<TimesheetEntry>('/api/timesheets', { method: 'POST', body: input })
    entries.value = [created, ...entries.value]
    return created
  }

  async function updateEntry(id: string, input: TimesheetEntryInput) {
    const updated = await $fetch<TimesheetEntry>(`/api/timesheets/${id}`, { method: 'PUT', body: input })
    entries.value = entries.value.map((e) => (e.id === id ? updated : e))
    return updated
  }

  async function removeEntry(id: string) {
    await $fetch(`/api/timesheets/${id}`, { method: 'DELETE' })
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  return { entries, pending, error, hasMore, loadingMore, fetchEntries, loadMore, createEntry, updateEntry, removeEntry }
}
