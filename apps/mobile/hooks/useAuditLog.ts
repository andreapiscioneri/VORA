import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { AuditLogEntry } from '@vora/shared/types/auditLog'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useAuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // §57 audit log is owner/admin-only server-side (requireRole) — a member
  // account gets a real 403, surfaced here distinctly from a network/loading
  // error so the UI can explain it instead of showing a generic failure.
  const [forbidden, setForbidden] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const page = await api.get<PageResult<AuditLogEntry>>('/audit-log')
      setEntries(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setForbidden(true)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load audit log')
      }
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
      const page = await api.get<PageResult<AuditLogEntry>>(`/audit-log?cursor=${encodeURIComponent(nextCursor)}`)
      setEntries((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  return { entries, loading, loadingMore, error, forbidden, hasMore, reload: load, loadMore }
}
