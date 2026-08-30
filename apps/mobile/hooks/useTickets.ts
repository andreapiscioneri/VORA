import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Ticket, TicketInput } from '@vora/shared/types/ticket'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<Ticket>>('/tickets')
      setTickets(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tickets')
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
      const page = await api.get<PageResult<Ticket>>(`/tickets?cursor=${encodeURIComponent(nextCursor)}`)
      setTickets((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: TicketInput) => {
    const created = await api.post<Ticket>('/tickets', input)
    setTickets((prev) => [...prev, created])
    return created
  }, [])

  return { tickets, loading, loadingMore, error, hasMore, reload: load, loadMore, create }
}
