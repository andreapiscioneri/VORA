import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { readCache, writeCache } from '../lib/offlineCache'
import type { CalendarEvent } from '@vora/shared/types/event'

const CACHE_KEY = 'events'

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<CalendarEvent[]>('/events')
      const sorted = [...data].sort((a, b) => (a.startAt < b.startAt ? -1 : 1))
      setEvents(sorted)
      setOffline(false)
      writeCache(CACHE_KEY, sorted)
    } catch (e) {
      const cached = await readCache<CalendarEvent[]>(CACHE_KEY)
      if (cached) {
        setEvents(cached)
        setOffline(true)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load events')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { events, loading, error, offline, reload: load }
}
