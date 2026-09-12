export const EMPLOYEE_STATUSES = ['active', 'inactive'] as const
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export const EMPLOYEE_DOCUMENT_TYPES = ['contract', 'certificate', 'id', 'other'] as const
export type EmployeeDocumentType = (typeof EMPLOYEE_DOCUMENT_TYPES)[number]

export interface EmployeeDocument {
  id: string
  title: string
  type: EmployeeDocumentType
  expiryDate: string | null
  url: string
  addedAt: string
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  team: string
  status: EmployeeStatus
  startDate: string | null
  /** Another employee's id — the organigramma builds its tree from this. Null means "reports to no one" (a root node). */
  managerId: string | null
  documents: EmployeeDocument[]
  createdAt: string
  updatedAt: string
}

export type EmployeeInput = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
