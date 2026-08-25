import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { readCache, writeCache } from '../lib/offlineCache'
import type { Employee, EmployeeInput } from '@vora/shared/types/employee'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

const CACHE_KEY = 'employees'

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
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
      const page = await api.get<PageResult<Employee>>('/employees')
      setEmployees(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
      setOffline(false)
      writeCache(CACHE_KEY, page.items)
    } catch (e) {
      const cached = await readCache<Employee[]>(CACHE_KEY)
      if (cached) {
        setEmployees(cached)
        setOffline(true)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load employees')
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
      const page = await api.get<PageResult<Employee>>(`/employees?cursor=${encodeURIComponent(nextCursor)}`)
      setEmployees((prev) => {
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

  const create = useCallback(async (input: EmployeeInput) => {
    const created = await api.post<Employee>('/employees', input)
    setEmployees((prev) => {
      const next = [...prev, created]
      writeCache(CACHE_KEY, next)
      return next
    })
    return created
  }, [])

  const update = useCallback(async (id: string, input: EmployeeInput) => {
    const updated = await api.put<Employee>(`/employees/${id}`, input)
    setEmployees((prev) => {
      const next = prev.map((e) => (e.id === id ? updated : e))
      writeCache(CACHE_KEY, next)
      return next
    })
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/employees/${id}`)
    setEmployees((prev) => {
      const next = prev.filter((e) => e.id !== id)
      writeCache(CACHE_KEY, next)
      return next
    })
  }, [])

  return { employees, loading, loadingMore, error, offline, hasMore, reload: load, loadMore, create, update, remove }
}
