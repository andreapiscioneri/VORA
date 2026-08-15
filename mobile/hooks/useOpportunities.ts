import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Opportunity } from '@vora/shared/types/opportunity'

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOpportunities(await api.get<Opportunity[]>('/opportunities'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { opportunities, loading, error, reload: load }
}
