export const PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'archived'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export interface ProjectDocument {
  id: string
  title: string
  url: string
  addedAt: string
}

export interface ProjectComment {
  id: string
  authorName: string
  body: string
  createdAt: string
}

export const MILESTONE_STATUSES = ['pending', 'completed'] as const
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number]

export interface ProjectMilestone {
  id: string
  title: string
  dueDate: string | null
  status: MilestoneStatus
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  contactId: string | null
  startDate: string | null
  dueDate: string | null
  budget: number
  documents: ProjectDocument[]
  discussion: ProjectComment[]
  milestones: ProjectMilestone[]
  createdAt: string
  updatedAt: string
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
