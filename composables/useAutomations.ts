import type { Automation, AutomationInput, AutomationRunResult } from '~/shared/types/automation'

export function useAutomations() {
  const automations = useState<Automation[]>('automations', () => [])
  const pending = useState('automations-pending', () => false)
  const error = useState<string | null>('automations-error', () => null)

  async function fetchAutomations() {
    pending.value = true
    error.value = null
    try {
      automations.value = await $fetch<Automation[]>('/api/automations')
    } catch {
      error.value = 'automations.errors.load'
    } finally {
      pending.value = false
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

  return { automations, pending, error, fetchAutomations, createAutomation, updateAutomation, removeAutomation, runAutomation }
}
