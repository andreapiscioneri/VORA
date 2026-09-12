import type { AttendanceEntry, AttendanceEntryInput } from '~/shared/types/attendance'
import type { PageResult } from '~/server/utils/pagination'

export function useAttendance() {
  const entries = useState<AttendanceEntry[]>('attendance-entries', () => [])
  const pending = useState('attendance-pending', () => false)
  const loadingMore = useState('attendance-loading-more', () => false)
  const error = useState<string | null>('attendance-error', () => null)
  const nextCursor = useState<string | null>('attendance-cursor', () => null)
  const hasMore = useState('attendance-has-more', () => false)

  async function fetchEntries() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<AttendanceEntry>>('/api/attendance')
      entries.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'attendance.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<AttendanceEntry>>('/api/attendance', { query: { cursor: nextCursor.value } })
      entries.value = [...entries.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createEntry(input: AttendanceEntryInput) {
    const created = await $fetch<AttendanceEntry>('/api/attendance', { method: 'POST', body: input })
    entries.value = [created, ...entries.value]
    return created
  }

  async function updateEntry(id: string, input: AttendanceEntryInput) {
    const updated = await $fetch<AttendanceEntry>(`/api/attendance/${id}`, { method: 'PUT', body: input })
    entries.value = entries.value.map((e) => (e.id === id ? updated : e))
    return updated
  }

  async function removeEntry(id: string) {
    await $fetch(`/api/attendance/${id}`, { method: 'DELETE' })
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  return { entries, pending, error, hasMore, loadingMore, fetchEntries, loadMore, createEntry, updateEntry, removeEntry }
}
