import type { ContactStatus } from './contact'

export interface SegmentFilter {
  status?: ContactStatus
  tags?: string[]
}

export interface Segment {
  id: string
  name: string
  filter: SegmentFilter
  createdAt: string
  updatedAt: string
}

export type SegmentInput = Omit<Segment, 'id' | 'createdAt' | 'updatedAt'>
