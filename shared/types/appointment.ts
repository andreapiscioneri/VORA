export const APPOINTMENT_STATUSES = ['scheduled', 'confirmed', 'completed', 'cancelled'] as const
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

export interface Appointment {
  id: string
  title: string
  contactId: string | null
  opportunityId: string | null
  startAt: string
  durationMinutes: number
  location: string
  videoCallUrl: string
  notes: string
  status: AppointmentStatus
  createdAt: string
  updatedAt: string
}

export type AppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
