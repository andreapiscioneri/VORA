import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { TimesheetEntry } from '@vora/shared/types/timesheet'

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

  return { entries, loading, loadingMore, error, hasMore, reload: load, loadMore }
}
