import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { TrainingCourse, TrainingCourseInput } from '@vora/shared/types/training'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function useTraining() {
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<TrainingCourse>>('/training')
      setCourses(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load training courses')
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
      const page = await api.get<PageResult<TrainingCourse>>(`/training?cursor=${encodeURIComponent(nextCursor)}`)
      setCourses((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: TrainingCourseInput) => {
    const created = await api.post<TrainingCourse>('/training', input)
    setCourses((prev) => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, input: TrainingCourseInput) => {
    const updated = await api.put<TrainingCourse>(`/training/${id}`, input)
    setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/training/${id}`)
    setCourses((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { courses, loading, loadingMore, error, hasMore, reload: load, loadMore, create, update, remove }
}
