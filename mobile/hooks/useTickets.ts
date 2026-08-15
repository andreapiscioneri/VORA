import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Ticket } from '@vora/shared/types/ticket'

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTickets(await api.get<Ticket[]>('/tickets'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { tickets, loading, error, reload: load }
}
