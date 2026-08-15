import type { Opportunity, OpportunityInput, OpportunityStage } from '~/shared/types/opportunity'

export function useOpportunities() {
  const opportunities = useState<Opportunity[]>('opportunities', () => [])
  const pending = useState('opportunities-pending', () => false)
  const error = useState<string | null>('opportunities-error', () => null)

  async function fetchOpportunities() {
    pending.value = true
    error.value = null
    try {
      opportunities.value = await $fetch<Opportunity[]>('/api/opportunities')
    } catch {
      error.value = 'crm.errors.load'
    } finally {
      pending.value = false
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

  return { opportunities, pending, error, fetchOpportunities, createOpportunity, updateOpportunity, setStage, removeOpportunity }
}
