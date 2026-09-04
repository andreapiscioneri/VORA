import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { readCache, writeCache } from '../lib/offlineCache'
import type { Task, TaskInput, TaskStatus } from '@vora/shared/types/task'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

const CACHE_KEY = 'tasks'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<Task>>('/tasks')
      setTasks(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
      setOffline(false)
      writeCache(CACHE_KEY, page.items)
    } catch (e) {
      // A network failure doesn't have to mean an empty screen — fall back
      // to whatever was last successfully fetched, and say so honestly
      // instead of pretending the cached list is fresh.
      const cached = await readCache<Task[]>(CACHE_KEY)
      if (cached) {
        setTasks(cached)
        setOffline(true)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load tasks')
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
      const page = await api.get<PageResult<Task>>(`/tasks?cursor=${encodeURIComponent(nextCursor)}`)
      setTasks((prev) => {
        const next = [...prev, ...page.items]
        writeCache(CACHE_KEY, next)
        return next
      })
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const setStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      const current = tasks.find((t) => t.id === id)
      if (!current) return
      const { id: _id, createdAt: _c, updatedAt: _u, ...input } = current
      const updated = await api.put<Task>(`/tasks/${id}`, { ...input, status })
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? updated : t))
        writeCache(CACHE_KEY, next)
        return next
      })
    },
    [tasks]
  )

  const create = useCallback(async (input: TaskInput) => {
    const created = await api.post<Task>('/tasks', input)
    setTasks((prev) => {
      const next = [...prev, created]
      writeCache(CACHE_KEY, next)
      return next
    })
    return created
  }, [])

  const update = useCallback(async (id: string, input: TaskInput) => {
    const updated = await api.put<Task>(`/tasks/${id}`, input)
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? updated : t))
      writeCache(CACHE_KEY, next)
      return next
    })
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/tasks/${id}`)
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id)
      writeCache(CACHE_KEY, next)
      return next
    })
  }, [])

  return { tasks, loading, loadingMore, error, offline, hasMore, reload: load, loadMore, setStatus, create, update, remove }
}
