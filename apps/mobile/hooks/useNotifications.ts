import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { AppNotification } from '@vora/shared/types/notification'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const loadUnreadCount = useCallback(async () => {
    try {
      const { count } = await api.get<{ count: number }>('/notifications/unread-count')
      setUnreadCount(count)
    } catch {
      // Badge count is best-effort — a failed refresh just keeps the last known count.
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<AppNotification>>('/notifications')
      setNotifications(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    loadUnreadCount()
  }, [load, loadUnreadCount])

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return
    setLoadingMore(true)
    try {
      const page = await api.get<PageResult<AppNotification>>(`/notifications?cursor=${encodeURIComponent(nextCursor)}`)
      setNotifications((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const markRead = useCallback(async (id: string, read: boolean) => {
    const updated = await api.put<AppNotification>(`/notifications/${id}`, { read })
    setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)))
    setUnreadCount((prev) => Math.max(0, prev + (read ? -1 : 1)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    const target = notifications.find((n) => n.id === id)
    await api.delete(`/notifications/${id}`)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (target && !target.read) setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [notifications])

  return { notifications, unreadCount, loading, loadingMore, error, hasMore, reload: load, loadMore, markRead, remove }
}
