import type { TimesheetEntry, TimesheetEntryInput } from '~/shared/types/timesheet'

export function useTimesheets() {
  const entries = useState<TimesheetEntry[]>('timesheets', () => [])
  const pending = useState('timesheets-pending', () => false)
  const error = useState<string | null>('timesheets-error', () => null)

  async function fetchEntries() {
    pending.value = true
    error.value = null
    try {
      entries.value = await $fetch<TimesheetEntry[]>('/api/timesheets')
    } catch {
      error.value = 'timesheets.errors.load'
    } finally {
      pending.value = false
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

  return { entries, pending, error, fetchEntries, createEntry, updateEntry, removeEntry }
}
