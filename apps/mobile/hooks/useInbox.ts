import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Communication } from '@vora/shared/types/communication'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useInbox() {
  const [items, setItems] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<Communication>>('/communications')
      setItems([...page.items].sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1)))
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inbox')
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
      const page = await api.get<PageResult<Communication>>(`/communications?cursor=${encodeURIComponent(nextCursor)}`)
      setItems((prev) => [...prev, ...page.items].sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1)))
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const markRead = useCallback(async (item: Communication) => {
    const { id, createdAt, updatedAt, ...input } = item
    const updated = await api.put<Communication>(`/communications/${id}`, { ...input, status: 'read' })
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
  }, [])

  return { items, loading, loadingMore, error, hasMore, reload: load, loadMore, markRead }
}
