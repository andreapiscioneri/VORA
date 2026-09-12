import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { PayrollRecord, PayrollRecordInput } from '@vora/shared/types/payroll'

interface PageResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export function usePayroll() {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.get<PageResult<PayrollRecord>>('/payroll')
      setRecords(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payroll records')
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
      const page = await api.get<PageResult<PayrollRecord>>(`/payroll?cursor=${encodeURIComponent(nextCursor)}`)
      setRecords((prev) => [...prev, ...page.items])
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, nextCursor])

  const create = useCallback(async (input: PayrollRecordInput) => {
    const created = await api.post<PayrollRecord>('/payroll', input)
    setRecords((prev) => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, input: PayrollRecordInput) => {
    const updated = await api.put<PayrollRecord>(`/payroll/${id}`, input)
    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/payroll/${id}`)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { records, loading, loadingMore, error, hasMore, reload: load, loadMore, create, update, remove }
}
