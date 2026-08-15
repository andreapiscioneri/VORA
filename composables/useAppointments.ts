import type { Appointment, AppointmentInput } from '~/shared/types/appointment'

export function useAppointments() {
  const appointments = useState<Appointment[]>('appointments', () => [])
  const pending = useState('appointments-pending', () => false)
  const error = useState<string | null>('appointments-error', () => null)

  async function fetchAppointments() {
    pending.value = true
    error.value = null
    try {
      appointments.value = await $fetch<Appointment[]>('/api/appointments')
    } catch {
      error.value = 'appointments.errors.load'
    } finally {
      pending.value = false
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

  return { appointments, pending, error, fetchAppointments, createAppointment, updateAppointment, removeAppointment }
}
