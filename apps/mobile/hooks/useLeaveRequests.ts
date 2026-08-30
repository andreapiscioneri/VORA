import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { LeaveRequest, LeaveRequestInput } from '@vora/shared/types/leave'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useLeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<LeaveRequest>>('/leave-requests')
      setRequests(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leave requests')
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
      const page = await api.get<PageResult<LeaveRequest>>(`/leave-requests?cursor=${encodeURIComponent(nextCursor)}`)
      setRequests((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: LeaveRequestInput) => {
    const created = await api.post<LeaveRequest>('/leave-requests', input)
    setRequests((prev) => [...prev, created])
    return created
  }, [])

  return { requests, loading, loadingMore, error, hasMore, reload: load, loadMore, create }
}
