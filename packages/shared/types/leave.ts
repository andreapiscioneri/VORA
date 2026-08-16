export const LEAVE_TYPES = ['vacation', 'sick', 'personal'] as const
export type LeaveType = (typeof LEAVE_TYPES)[number]

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected'] as const
export type LeaveStatus = (typeof LEAVE_STATUSES)[number]

export interface LeaveRequest {
  id: string
  requesterName: string
  type: LeaveType
  startDate: string
  endDate: string
  status: LeaveStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export type LeaveRequestInput = Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>
