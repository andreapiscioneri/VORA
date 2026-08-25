import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { readCache, writeCache } from '../lib/offlineCache'
import type { Expense, ExpenseInput } from '@vora/shared/types/expense'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

const CACHE_KEY = 'expenses'

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
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
      const page = await api.get<PageResult<Expense>>('/expenses')
      setExpenses(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
      setOffline(false)
      writeCache(CACHE_KEY, page.items)
    } catch (e) {
      const cached = await readCache<Expense[]>(CACHE_KEY)
      if (cached) {
        setExpenses(cached)
        setOffline(true)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load expenses')
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
      const page = await api.get<PageResult<Expense>>(`/expenses?cursor=${encodeURIComponent(nextCursor)}`)
      setExpenses((prev) => {
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

  const create = useCallback(async (input: ExpenseInput) => {
    const created = await api.post<Expense>('/expenses', input)
    setExpenses((prev) => {
      const next = [...prev, created]
      writeCache(CACHE_KEY, next)
      return next
    })
    return created
  }, [])

  const update = useCallback(async (id: string, input: ExpenseInput) => {
    const updated = await api.put<Expense>(`/expenses/${id}`, input)
    setExpenses((prev) => {
      const next = prev.map((e) => (e.id === id ? updated : e))
      writeCache(CACHE_KEY, next)
      return next
    })
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/expenses/${id}`)
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id)
      writeCache(CACHE_KEY, next)
      return next
    })
  }, [])

  return { expenses, loading, loadingMore, error, offline, hasMore, reload: load, loadMore, create, update, remove }
}
