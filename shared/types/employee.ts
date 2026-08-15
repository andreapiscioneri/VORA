export const EMPLOYEE_STATUSES = ['active', 'inactive'] as const
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  team: string
  status: EmployeeStatus
  startDate: string | null
  createdAt: string
  updatedAt: string
}

export type EmployeeInput = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
