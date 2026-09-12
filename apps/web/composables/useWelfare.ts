import type { WelfareInitiative, WelfareInitiativeInput } from '~/shared/types/welfare'
import type { PageResult } from '~/server/utils/pagination'

export function useWelfare() {
  const { $apiFetch } = useNuxtApp()
  const initiatives = useState<WelfareInitiative[]>('welfare-initiatives', () => [])
  const pending = useState('welfare-pending', () => false)
  const loadingMore = useState('welfare-loading-more', () => false)
  const error = useState<string | null>('welfare-error', () => null)
  const nextCursor = useState<string | null>('welfare-cursor', () => null)
  const hasMore = useState('welfare-has-more', () => false)

  async function fetchInitiatives() {
    pending.value = true
    error.value = null
    try {
      const page = await $apiFetch<PageResult<WelfareInitiative>>('/api/welfare')
      initiatives.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'welfare.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $apiFetch<PageResult<WelfareInitiative>>('/api/welfare', { query: { cursor: nextCursor.value } })
      initiatives.value = [...initiatives.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createInitiative(input: WelfareInitiativeInput) {
    const created = await $apiFetch<WelfareInitiative>('/api/welfare', { method: 'POST', body: input })
    initiatives.value = [created, ...initiatives.value]
    return created
  }

  async function updateInitiative(id: string, input: WelfareInitiativeInput) {
    const updated = await $apiFetch<WelfareInitiative>(`/api/welfare/${id}`, { method: 'PUT', body: input })
    initiatives.value = initiatives.value.map((i) => (i.id === id ? updated : i))
    return updated
  }

  async function removeInitiative(id: string) {
    await $apiFetch(`/api/welfare/${id}`, { method: 'DELETE' })
    initiatives.value = initiatives.value.filter((i) => i.id !== id)
  }

  return { initiatives, pending, error, hasMore, loadingMore, fetchInitiatives, loadMore, createInitiative, updateInitiative, removeInitiative }
}
