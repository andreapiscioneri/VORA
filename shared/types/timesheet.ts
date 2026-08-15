export interface TimesheetEntry {
  id: string
  projectId: string | null
  taskId: string | null
  description: string
  date: string
  durationMinutes: number
  billable: boolean
  createdAt: string
  updatedAt: string
}

export type TimesheetEntryInput = Omit<TimesheetEntry, 'id' | 'createdAt' | 'updatedAt'>
