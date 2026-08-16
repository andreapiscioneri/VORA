import type { CalendarEvent, CalendarEventInput } from '~/shared/types/event'

export function useEvents() {
  const events = useState<CalendarEvent[]>('events', () => [])
  const pending = useState('events-pending', () => false)
  const error = useState<string | null>('events-error', () => null)

  async function fetchEvents() {
    pending.value = true
    error.value = null
    try {
      events.value = await $fetch<CalendarEvent[]>('/api/events')
    } catch {
      error.value = 'calendar.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function createEvent(input: CalendarEventInput) {
    const created = await $fetch<CalendarEvent>('/api/events', { method: 'POST', body: input })
    events.value = [...events.value, created].sort((a, b) => a.startAt.localeCompare(b.startAt))
    return created
  }

  async function updateEvent(id: string, input: CalendarEventInput) {
    const updated = await $fetch<CalendarEvent>(`/api/events/${id}`, { method: 'PUT', body: input })
    events.value = events.value
      .map((e) => (e.id === id ? updated : e))
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
    return updated
  }

  async function removeEvent(id: string) {
    await $fetch(`/api/events/${id}`, { method: 'DELETE' })
    events.value = events.value.filter((e) => e.id !== id)
  }

  return { events, pending, error, fetchEvents, createEvent, updateEvent, removeEvent }
}
