export interface MicroSite {
  id: string
  slug: string
  name: string
  tagline: string
  about: string
  contactEmail: string
  accentColor: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export type MicroSiteInput = Omit<MicroSite, 'id' | 'createdAt' | 'updatedAt'>
