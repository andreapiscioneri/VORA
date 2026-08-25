import type { Appointment, AppointmentInput } from '~/shared/types/appointment'
import type { PageResult } from '~/server/utils/pagination'

export function useAppointments() {
  const appointments = useState<Appointment[]>('appointments', () => [])
  const pending = useState('appointments-pending', () => false)
  const loadingMore = useState('appointments-loading-more', () => false)
  const error = useState<string | null>('appointments-error', () => null)
  const nextCursor = useState<string | null>('appointments-cursor', () => null)
  const hasMore = useState('appointments-has-more', () => false)

  async function fetchAppointments() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<Appointment>>('/api/appointments')
      appointments.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'appointments.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<Appointment>>('/api/appointments', { query: { cursor: nextCursor.value } })
      appointments.value = [...appointments.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createAppointment(input: AppointmentInput) {
    const created = await $fetch<Appointment>('/api/appointments', { method: 'POST', body: input })
    appointments.value = [...appointments.value, created].sort((a, b) => a.startAt.localeCompare(b.startAt))
    return created
  }

  async function updateAppointment(id: string, input: AppointmentInput) {
    const updated = await $fetch<Appointment>(`/api/appointments/${id}`, { method: 'PUT', body: input })
    appointments.value = appointments.value
      .map((a) => (a.id === id ? updated : a))
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
    return updated
  }

  async function removeAppointment(id: string) {
    await $fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    appointments.value = appointments.value.filter((a) => a.id !== id)
  }

  return { appointments, pending, error, hasMore, loadingMore, fetchAppointments, loadMore, createAppointment, updateAppointment, removeAppointment }
}
