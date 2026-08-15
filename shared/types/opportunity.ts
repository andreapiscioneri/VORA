export const OPPORTUNITY_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number]

export const OPPORTUNITY_SOURCES = ['manual', 'website', 'referral', 'email', 'whatsapp', 'import'] as const
export type OpportunitySource = (typeof OPPORTUNITY_SOURCES)[number]

export interface Opportunity {
  id: string
  title: string
  contactId: string | null
  company: string
  value: number
  currency: string
  probability: number
  stage: OpportunityStage
  source: OpportunitySource
  notes: string
  expectedCloseDate: string | null
  createdAt: string
  updatedAt: string
}

export type OpportunityInput = Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>
