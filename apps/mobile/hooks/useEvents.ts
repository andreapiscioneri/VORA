import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { readCache, writeCache } from '../lib/offlineCache'
import type { CalendarEvent, CalendarEventInput } from '@vora/shared/types/event'

const CACHE_KEY = 'events'

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  // Unpaginated on purpose (see server/api/events/all.get.ts): the calendar
  // screen needs the complete event set, and events are naturally bounded
  // per org unlike contacts/tasks, so cursor pagination doesn't apply here.
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await api.get<CalendarEvent[]>('/events/all')
      const sorted = [...items].sort((a, b) => (a.startAt < b.startAt ? -1 : 1))
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

  const create = useCallback(async (input: CalendarEventInput) => {
    const created = await api.post<CalendarEvent>('/events', input)
    setEvents((prev) => [...prev, created].sort((a, b) => (a.startAt < b.startAt ? -1 : 1)))
    return created
  }, [])

  const update = useCallback(async (id: string, input: CalendarEventInput) => {
    const updated = await api.put<CalendarEvent>(`/events/${id}`, input)
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)).sort((a, b) => (a.startAt < b.startAt ? -1 : 1)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/events/${id}`)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { events, loading, error, offline, reload: load, create, update, remove }
}
