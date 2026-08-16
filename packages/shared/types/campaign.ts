export const CAMPAIGN_STATUSES = ['draft', 'sent'] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export interface MarketingCampaign {
  id: string
  name: string
  subject: string
  body: string
  recipientCount: number
  status: CampaignStatus
  sentAt: string | null
  createdAt: string
  updatedAt: string
}

export type MarketingCampaignInput = Omit<MarketingCampaign, 'id' | 'createdAt' | 'updatedAt'>
