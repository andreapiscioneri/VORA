import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { TimesheetEntry } from '@vora/shared/types/timesheet'

export function useTimesheets() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<TimesheetEntry[]>('/timesheets')
      setEntries([...data].sort((a, b) => (a.date < b.date ? 1 : -1)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load timesheets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { entries, loading, error, reload: load }
}
