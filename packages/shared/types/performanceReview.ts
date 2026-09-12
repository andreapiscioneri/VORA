export const REVIEW_STATUSES = ['draft', 'submitted', 'completed'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export interface PerformanceReview {
  id: string
  employeeId: string | null
  employeeName: string
  period: string
  reviewerName: string
  rating: number
  strengths: string
  improvements: string
  goals: string
  status: ReviewStatus
  reviewDate: string | null
  createdAt: string
  updatedAt: string
}

export type PerformanceReviewInput = Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>
