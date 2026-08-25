import type { Automation, AutomationInput, AutomationRunResult } from '~/shared/types/automation'
import type { PageResult } from '~/server/utils/pagination'

export function useAutomations() {
  const automations = useState<Automation[]>('automations', () => [])
  const pending = useState('automations-pending', () => false)
  const loadingMore = useState('automations-loading-more', () => false)
  const error = useState<string | null>('automations-error', () => null)
  const nextCursor = useState<string | null>('automations-cursor', () => null)
  const hasMore = useState('automations-has-more', () => false)

  async function fetchAutomations() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<Automation>>('/api/automations')
      automations.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'automations.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<Automation>>('/api/automations', { query: { cursor: nextCursor.value } })
      automations.value = [...automations.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createAutomation(input: AutomationInput) {
    const created = await $fetch<Automation>('/api/automations', { method: 'POST', body: input })
    automations.value = [created, ...automations.value]
    return created
  }

  async function updateAutomation(id: string, input: AutomationInput) {
    const updated = await $fetch<Automation>(`/api/automations/${id}`, { method: 'PUT', body: input })
    automations.value = automations.value.map((a) => (a.id === id ? updated : a))
    return updated
  }

  async function removeAutomation(id: string) {
    await $fetch(`/api/automations/${id}`, { method: 'DELETE' })
    automations.value = automations.value.filter((a) => a.id !== id)
  }

  async function runAutomation(id: string, contactId: string) {
    return await $fetch<AutomationRunResult>(`/api/automations/${id}/run`, { method: 'POST', body: { contactId } })
  }

  return { automations, pending, error, hasMore, loadingMore, fetchAutomations, loadMore, createAutomation, updateAutomation, removeAutomation, runAutomation }
}
