import { z } from 'zod'
import { CANDIDATE_STAGES, CANDIDATE_SOURCES } from '../types/candidate'

export const candidateInputSchema = z.object({
  firstName: z.string().trim().min(1, 'validation.required').max(80),
  lastName: z.string().trim().min(1, 'validation.required').max(80),
  email: z.union([z.string().trim().email('validation.email'), z.literal('')]).default(''),
  phone: z.string().trim().max(40).default(''),
  role: z.string().trim().max(120).default(''),
  stage: z.enum(CANDIDATE_STAGES).default('applied'),
  source: z.enum(CANDIDATE_SOURCES).default('other'),
  resumeUrl: z.string().trim().max(500).default(''),
  notes: z.string().trim().max(4000).default(''),
  interviewDate: z.string().nullable().default(null),
})

export type CandidateInputSchema = z.infer<typeof candidateInputSchema>
