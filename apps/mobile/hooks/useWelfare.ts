import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { WelfareInitiative, WelfareInitiativeInput } from '@vora/shared/types/welfare'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useWelfare() {
  const [initiatives, setInitiatives] = useState<WelfareInitiative[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<WelfareInitiative>>('/welfare')
      setInitiatives(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load welfare initiatives')
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
      const page = await api.get<PageResult<WelfareInitiative>>(`/welfare?cursor=${encodeURIComponent(nextCursor)}`)
      setInitiatives((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: WelfareInitiativeInput) => {
    const created = await api.post<WelfareInitiative>('/welfare', input)
    setInitiatives((prev) => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, input: WelfareInitiativeInput) => {
    const updated = await api.put<WelfareInitiative>(`/welfare/${id}`, input)
    setInitiatives((prev) => prev.map((i) => (i.id === id ? updated : i)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/welfare/${id}`)
    setInitiatives((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return { initiatives, loading, loadingMore, error, hasMore, reload: load, loadMore, create, update, remove }
}
