import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Communication } from '@vora/shared/types/communication'

export function useInbox() {
  const [items, setItems] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Communication[]>('/communications')
      setItems([...data].sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const markRead = useCallback(async (item: Communication) => {
    const { id, createdAt, updatedAt, ...input } = item
    const updated = await api.put<Communication>(`/communications/${id}`, { ...input, status: 'read' })
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
  }, [])

  return { items, loading, error, reload: load, markRead }
}
