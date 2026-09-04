import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Opportunity, OpportunityInput } from '@vora/shared/types/opportunity'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<Opportunity>>('/opportunities')
      setOpportunities(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load opportunities')
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
      const page = await api.get<PageResult<Opportunity>>(`/opportunities?cursor=${encodeURIComponent(nextCursor)}`)
      setOpportunities((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: OpportunityInput) => {
    const created = await api.post<Opportunity>('/opportunities', input)
    setOpportunities((prev) => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, input: OpportunityInput) => {
    const updated = await api.put<Opportunity>(`/opportunities/${id}`, input)
    setOpportunities((prev) => prev.map((o) => (o.id === id ? updated : o)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/opportunities/${id}`)
    setOpportunities((prev) => prev.filter((o) => o.id !== id))
  }, [])

  return { opportunities, loading, loadingMore, error, hasMore, reload: load, loadMore, create, update, remove }
}
