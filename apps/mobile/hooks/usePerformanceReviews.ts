import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { PerformanceReview, PerformanceReviewInput } from '@vora/shared/types/performanceReview'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function usePerformanceReviews() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<PerformanceReview>>('/performance-reviews')
      setReviews(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reviews')
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
      const page = await api.get<PageResult<PerformanceReview>>(`/performance-reviews?cursor=${encodeURIComponent(nextCursor)}`)
      setReviews((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: PerformanceReviewInput) => {
    const created = await api.post<PerformanceReview>('/performance-reviews', input)
    setReviews((prev) => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, input: PerformanceReviewInput) => {
    const updated = await api.put<PerformanceReview>(`/performance-reviews/${id}`, input)
    setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/performance-reviews/${id}`)
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { reviews, loading, loadingMore, error, hasMore, reload: load, loadMore, create, update, remove }
}
