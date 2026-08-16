import type { WebsiteOverview } from '~/shared/types/website'

export function useWebsite() {
  const overview = useState<WebsiteOverview | null>('website-overview', () => null)
  const pending = useState('website-pending', () => false)
  const error = useState<string | null>('website-error', () => null)

  async function fetchOverview() {
    pending.value = true
    error.value = null
    try {
      overview.value = await $fetch<WebsiteOverview>('/api/website/overview')
    } catch {
      error.value = 'website.errors.load'
    } finally {
      pending.value = false
    }
  }

  return { overview, pending, error, fetchOverview }
}
