import type { Opportunity, OpportunityInput, OpportunityStage } from '~/shared/types/opportunity'
import type { PageResult } from '~/server/utils/pagination'

export function useOpportunities() {
  const opportunities = useState<Opportunity[]>('opportunities', () => [])
  const pending = useState('opportunities-pending', () => false)
  const loadingMore = useState('opportunities-loading-more', () => false)
  const error = useState<string | null>('opportunities-error', () => null)
  const nextCursor = useState<string | null>('opportunities-cursor', () => null)
  const hasMore = useState('opportunities-has-more', () => false)

  async function fetchOpportunities() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<Opportunity>>('/api/opportunities')
      opportunities.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'crm.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<Opportunity>>('/api/opportunities', { query: { cursor: nextCursor.value } })
      opportunities.value = [...opportunities.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createOpportunity(input: OpportunityInput) {
    const created = await $fetch<Opportunity>('/api/opportunities', { method: 'POST', body: input })
    opportunities.value = [created, ...opportunities.value]
    return created
  }

  async function updateOpportunity(id: string, input: OpportunityInput) {
    const updated = await $fetch<Opportunity>(`/api/opportunities/${id}`, { method: 'PUT', body: input })
    opportunities.value = opportunities.value.map((o) => (o.id === id ? updated : o))
    return updated
  }

  async function setStage(opp: Opportunity, stage: OpportunityStage) {
    const { id, createdAt, updatedAt, ...input } = opp
    await updateOpportunity(id, { ...input, stage })
  }

  async function removeOpportunity(id: string) {
    await $fetch(`/api/opportunities/${id}`, { method: 'DELETE' })
    opportunities.value = opportunities.value.filter((o) => o.id !== id)
  }

  return { opportunities, pending, error, hasMore, loadingMore, fetchOpportunities, loadMore, createOpportunity, updateOpportunity, setStage, removeOpportunity }
}
