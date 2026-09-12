import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { AttendanceEntry, AttendanceEntryInput } from '@vora/shared/types/attendance'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useAttendance() {
  const [entries, setEntries] = useState<AttendanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<AttendanceEntry>>('/attendance')
      setEntries(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance')
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
      const page = await api.get<PageResult<AttendanceEntry>>(`/attendance?cursor=${encodeURIComponent(nextCursor)}`)
      setEntries((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: AttendanceEntryInput) => {
    const created = await api.post<AttendanceEntry>('/attendance', input)
    setEntries((prev) => [created, ...prev])
    return created
  }, [])

  const update = useCallback(async (id: string, input: AttendanceEntryInput) => {
    const updated = await api.put<AttendanceEntry>(`/attendance/${id}`, input)
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/attendance/${id}`)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { entries, loading, loadingMore, error, hasMore, reload: load, loadMore, create, update, remove }
}
