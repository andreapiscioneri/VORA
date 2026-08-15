import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { readCache, writeCache } from '../lib/offlineCache'
import type { Task, TaskStatus } from '@vora/shared/types/task'

const CACHE_KEY = 'tasks'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Task[]>('/tasks')
      setTasks(data)
      setOffline(false)
      writeCache(CACHE_KEY, data)
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

  return { tasks, loading, error, offline, reload: load, setStatus }
}
