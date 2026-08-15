import type { MarketingCampaign, MarketingCampaignInput } from '~/shared/types/campaign'

export function useCampaigns() {
  const campaigns = useState<MarketingCampaign[]>('campaigns', () => [])
  const pending = useState('campaigns-pending', () => false)
  const error = useState<string | null>('campaigns-error', () => null)

  async function fetchCampaigns() {
    pending.value = true
    error.value = null
    try {
      campaigns.value = await $fetch<MarketingCampaign[]>('/api/campaigns')
    } catch {
      error.value = 'campaigns.errors.load'
    } finally {
      pending.value = false
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

  return { campaigns, pending, error, fetchCampaigns, createCampaign, updateCampaign, sendCampaign, removeCampaign }
}
