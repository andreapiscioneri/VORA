export const CANDIDATE_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const
export type CandidateStage = (typeof CANDIDATE_STAGES)[number]

export const CANDIDATE_SOURCES = ['website', 'referral', 'linkedin', 'agency', 'other'] as const
export type CandidateSource = (typeof CANDIDATE_SOURCES)[number]

export interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  stage: CandidateStage
  source: CandidateSource
  resumeUrl: string
  notes: string
  interviewDate: string | null
  createdAt: string
  updatedAt: string
}

export type CandidateInput = Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>
