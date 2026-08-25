import type { MarketingCampaign, MarketingCampaignInput } from '~/shared/types/campaign'
import type { PageResult } from '~/server/utils/pagination'

export function useCampaigns() {
  const campaigns = useState<MarketingCampaign[]>('campaigns', () => [])
  const pending = useState('campaigns-pending', () => false)
  const loadingMore = useState('campaigns-loading-more', () => false)
  const error = useState<string | null>('campaigns-error', () => null)
  const nextCursor = useState<string | null>('campaigns-cursor', () => null)
  const hasMore = useState('campaigns-has-more', () => false)

  async function fetchCampaigns() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<MarketingCampaign>>('/api/campaigns')
      campaigns.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'campaigns.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<MarketingCampaign>>('/api/campaigns', { query: { cursor: nextCursor.value } })
      campaigns.value = [...campaigns.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createCampaign(input: MarketingCampaignInput) {
    const created = await $fetch<MarketingCampaign>('/api/campaigns', { method: 'POST', body: input })
    campaigns.value = [created, ...campaigns.value]
    return created
  }

  async function updateCampaign(id: string, input: MarketingCampaignInput) {
    const updated = await $fetch<MarketingCampaign>(`/api/campaigns/${id}`, { method: 'PUT', body: input })
    campaigns.value = campaigns.value.map((c) => (c.id === id ? updated : c))
    return updated
  }

  async function sendCampaign(id: string) {
    const result = await $fetch<{ campaign: MarketingCampaign }>(`/api/campaigns/${id}/send`, { method: 'POST' })
    campaigns.value = campaigns.value.map((c) => (c.id === id ? result.campaign : c))
    return result
  }

  async function removeCampaign(id: string) {
    await $fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    campaigns.value = campaigns.value.filter((c) => c.id !== id)
  }

  return { campaigns, pending, error, hasMore, loadingMore, fetchCampaigns, loadMore, createCampaign, updateCampaign, sendCampaign, removeCampaign }
}
