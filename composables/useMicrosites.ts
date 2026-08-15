import type { MicroSite, MicroSiteInput } from '~/shared/types/microsite'

export function useMicrosites() {
  const sites = useState<MicroSite[]>('microsites', () => [])
  const pending = useState('microsites-pending', () => false)
  const error = useState<string | null>('microsites-error', () => null)

  async function fetchSites() {
    pending.value = true
    error.value = null
    try {
      sites.value = await $fetch<MicroSite[]>('/api/microsites')
    } catch {
      error.value = 'sites.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function createSite(input: MicroSiteInput) {
    const created = await $fetch<MicroSite>('/api/microsites', { method: 'POST', body: input })
    sites.value = [created, ...sites.value]
    return created
  }

  async function updateSite(id: string, input: MicroSiteInput) {
    const updated = await $fetch<MicroSite>(`/api/microsites/${id}`, { method: 'PUT', body: input })
    sites.value = sites.value.map((s) => (s.id === id ? updated : s))
    return updated
  }

  async function removeSite(id: string) {
    await $fetch(`/api/microsites/${id}`, { method: 'DELETE' })
    sites.value = sites.value.filter((s) => s.id !== id)
  }

  return { sites, pending, error, fetchSites, createSite, updateSite, removeSite }
}
