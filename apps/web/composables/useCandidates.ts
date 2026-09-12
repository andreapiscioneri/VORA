import type { Candidate, CandidateInput } from '~/shared/types/candidate'
import type { PageResult } from '~/server/utils/pagination'

export function useCandidates() {
  const { $apiFetch } = useNuxtApp()
  const candidates = useState<Candidate[]>('candidates', () => [])
  const pending = useState('candidates-pending', () => false)
  const loadingMore = useState('candidates-loading-more', () => false)
  const error = useState<string | null>('candidates-error', () => null)
  const nextCursor = useState<string | null>('candidates-cursor', () => null)
  const hasMore = useState('candidates-has-more', () => false)

  async function fetchCandidates() {
    pending.value = true
    error.value = null
    try {
      const page = await $apiFetch<PageResult<Candidate>>('/api/candidates')
      candidates.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'recruiting.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $apiFetch<PageResult<Candidate>>('/api/candidates', { query: { cursor: nextCursor.value } })
      candidates.value = [...candidates.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createCandidate(input: CandidateInput) {
    const created = await $apiFetch<Candidate>('/api/candidates', { method: 'POST', body: input })
    candidates.value = [created, ...candidates.value]
    return created
  }

  async function updateCandidate(id: string, input: CandidateInput) {
    const updated = await $apiFetch<Candidate>(`/api/candidates/${id}`, { method: 'PUT', body: input })
    candidates.value = candidates.value.map((c) => (c.id === id ? updated : c))
    return updated
  }

  async function removeCandidate(id: string) {
    await $apiFetch(`/api/candidates/${id}`, { method: 'DELETE' })
    candidates.value = candidates.value.filter((c) => c.id !== id)
  }

  return { candidates, pending, error, hasMore, loadingMore, fetchCandidates, loadMore, createCandidate, updateCandidate, removeCandidate }
}
