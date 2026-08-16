import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { WellbeingCheckIn, WellbeingCheckInInput } from '@vora/shared/types/wellbeing'

export function useWellbeing() {
  const [checkIns, setCheckIns] = useState<WellbeingCheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCheckIns(await api.get<WellbeingCheckIn[]>('/wellbeing'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load check-ins')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saveCheckIn = useCallback(async (input: WellbeingCheckInInput) => {
    const saved = await api.post<WellbeingCheckIn>('/wellbeing', input)
    setCheckIns((prev) => [saved, ...prev.filter((c) => c.date !== saved.date)])
    return saved
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayCheckIn = checkIns.find((c) => c.date === today) ?? null

  return { checkIns, loading, error, reload: load, saveCheckIn, todayCheckIn, today }
}
