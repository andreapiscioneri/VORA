export const TRAINING_STATUSES = ['planned', 'in_progress', 'completed'] as const
export type TrainingStatus = (typeof TRAINING_STATUSES)[number]

export interface TrainingCourse {
  id: string
  title: string
  employeeName: string
  provider: string
  status: TrainingStatus
  startDate: string | null
  completionDate: string | null
  certificateUrl: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type TrainingCourseInput = Omit<TrainingCourse, 'id' | 'createdAt' | 'updatedAt'>
