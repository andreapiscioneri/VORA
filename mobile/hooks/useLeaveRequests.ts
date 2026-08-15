import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { LeaveRequest } from '@vora/shared/types/leave'

export function useLeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRequests(await api.get<LeaveRequest[]>('/leave-requests'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { requests, loading, error, reload: load }
}
