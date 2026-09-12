export const WELFARE_STATUSES = ['active', 'inactive'] as const
export type WelfareStatus = (typeof WELFARE_STATUSES)[number]

export const WELFARE_CATEGORIES = ['health', 'meal', 'transport', 'wellness', 'other'] as const
export type WelfareCategory = (typeof WELFARE_CATEGORIES)[number]

export interface WelfareInitiative {
  id: string
  title: string
  description: string
  category: WelfareCategory
  status: WelfareStatus
  enrolledCount: number
  startDate: string | null
  endDate: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export type WelfareInitiativeInput = Omit<WelfareInitiative, 'id' | 'createdAt' | 'updatedAt'>
