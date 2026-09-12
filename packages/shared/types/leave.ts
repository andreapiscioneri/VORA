export const LEAVE_TYPES = ['vacation', 'sick', 'personal'] as const
export type LeaveType = (typeof LEAVE_TYPES)[number]

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected'] as const
export type LeaveStatus = (typeof LEAVE_STATUSES)[number]

export interface LeaveRequest {
  id: string
  requesterName: string
  requesterId: string | null
  /** The requester's Employee record — used to resolve their manager
   * (Employee.managerId) so approval can be routed to that manager, not
   * just any owner/admin. Null when the requester isn't linked to an
   * Employee record (e.g. requesterName was typed freehand). */
  employeeId: string | null
  type: LeaveType
  startDate: string
  endDate: string
  status: LeaveStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export type LeaveRequestInput = Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt' | 'requesterId'>
