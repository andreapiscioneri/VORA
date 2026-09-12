export interface AttendanceEntry {
  id: string
  employeeId: string | null
  employeeName: string
  date: string
  checkIn: string
  checkOut: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type AttendanceEntryInput = Omit<AttendanceEntry, 'id' | 'createdAt' | 'updatedAt'>
