export interface WebsitePage {
  route: string
  file: string
}

export interface WebsiteProject {
  slug: string
  title: string
  client: string
  year: string
  featured: boolean
}

export interface WebsiteOverview {
  siteUrl: string
  connected: boolean
  pages: WebsitePage[]
  projects: WebsiteProject[]
}
