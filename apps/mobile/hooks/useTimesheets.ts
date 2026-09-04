import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { TimesheetEntry, TimesheetEntryInput } from '@vora/shared/types/timesheet'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useTimesheets() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<TimesheetEntry>>('/timesheets')
      setEntries([...page.items].sort((a, b) => (a.date < b.date ? 1 : -1)))
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load timesheets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return
    setLoadingMore(true)
    try {
      const page = await api.get<PageResult<TimesheetEntry>>(`/timesheets?cursor=${encodeURIComponent(nextCursor)}`)
      setEntries((prev) => [...prev, ...page.items].sort((a, b) => (a.date < b.date ? 1 : -1)))
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: TimesheetEntryInput) => {
    const created = await api.post<TimesheetEntry>('/timesheets', input)
    setEntries((prev) => [...prev, created].sort((a, b) => (a.date < b.date ? 1 : -1)))
    return created
  }, [])

  const update = useCallback(async (id: string, input: TimesheetEntryInput) => {
    const updated = await api.put<TimesheetEntry>(`/timesheets/${id}`, input)
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)).sort((a, b) => (a.date < b.date ? 1 : -1)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/timesheets/${id}`)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { entries, loading, loadingMore, error, hasMore, reload: load, loadMore, create, update, remove }
}
