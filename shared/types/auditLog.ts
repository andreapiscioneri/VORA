export const AUDIT_ACTIONS = [
  'login',
  'logout',
  'password.change',
  'employee.create',
  'employee.update',
  'employee.delete',
  'leave.approve',
  'leave.reject',
  'expense.approve',
  'expense.reject',
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export interface AuditLogEntry {
  id: string
  userId: string
  userName: string
  action: AuditAction
  entityType: string
  entityId: string | null
  createdAt: string
}
