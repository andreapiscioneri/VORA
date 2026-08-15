export const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'linkedin', 'x'] as const
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export const SOCIAL_POST_STATUSES = ['draft', 'scheduled', 'published'] as const
export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number]

export interface SocialPost {
  id: string
  content: string
  platform: SocialPlatform
  status: SocialPostStatus
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
}

export type SocialPostInput = Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>
