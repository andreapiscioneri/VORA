import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Candidate, CandidateInput } from '@vora/shared/types/candidate'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<Candidate>>('/candidates')
      setCandidates(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load candidates')
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
      const page = await api.get<PageResult<Candidate>>(`/candidates?cursor=${encodeURIComponent(nextCursor)}`)
      setCandidates((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: CandidateInput) => {
    const created = await api.post<Candidate>('/candidates', input)
    setCandidates((prev) => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, input: CandidateInput) => {
    const updated = await api.put<Candidate>(`/candidates/${id}`, input)
    setCandidates((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/candidates/${id}`)
    setCandidates((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { candidates, loading, loadingMore, error, hasMore, reload: load, loadMore, create, update, remove }
}
