import type { MicroSite, MicroSiteInput } from '~/shared/types/microsite'
import type { PageResult } from '~/server/utils/pagination'

export function useMicrosites() {
  const sites = useState<MicroSite[]>('microsites', () => [])
  const pending = useState('microsites-pending', () => false)
  const loadingMore = useState('microsites-loading-more', () => false)
  const error = useState<string | null>('microsites-error', () => null)
  const nextCursor = useState<string | null>('microsites-cursor', () => null)
  const hasMore = useState('microsites-has-more', () => false)

  async function fetchSites() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<MicroSite>>('/api/microsites')
      sites.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'sites.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<MicroSite>>('/api/microsites', { query: { cursor: nextCursor.value } })
      sites.value = [...sites.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
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

  return { sites, pending, error, hasMore, loadingMore, fetchSites, loadMore, createSite, updateSite, removeSite }
}
