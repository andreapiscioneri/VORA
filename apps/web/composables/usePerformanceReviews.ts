import type { PerformanceReview, PerformanceReviewInput } from '~/shared/types/performanceReview'
import type { PageResult } from '~/server/utils/pagination'

export function usePerformanceReviews() {
  const { $apiFetch } = useNuxtApp()
  const reviews = useState<PerformanceReview[]>('performance-reviews', () => [])
  const pending = useState('performance-reviews-pending', () => false)
  const loadingMore = useState('performance-reviews-loading-more', () => false)
  const error = useState<string | null>('performance-reviews-error', () => null)
  const nextCursor = useState<string | null>('performance-reviews-cursor', () => null)
  const hasMore = useState('performance-reviews-has-more', () => false)

  async function fetchReviews() {
    pending.value = true
    error.value = null
    try {
      const page = await $apiFetch<PageResult<PerformanceReview>>('/api/performance-reviews')
      reviews.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'performanceReviews.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $apiFetch<PageResult<PerformanceReview>>('/api/performance-reviews', { query: { cursor: nextCursor.value } })
      reviews.value = [...reviews.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createReview(input: PerformanceReviewInput) {
    const created = await $apiFetch<PerformanceReview>('/api/performance-reviews', { method: 'POST', body: input })
    reviews.value = [created, ...reviews.value]
    return created
  }

  async function updateReview(id: string, input: PerformanceReviewInput) {
    const updated = await $apiFetch<PerformanceReview>(`/api/performance-reviews/${id}`, { method: 'PUT', body: input })
    reviews.value = reviews.value.map((r) => (r.id === id ? updated : r))
    return updated
  }

  async function removeReview(id: string) {
    await $apiFetch(`/api/performance-reviews/${id}`, { method: 'DELETE' })
    reviews.value = reviews.value.filter((r) => r.id !== id)
  }

  return { reviews, pending, error, hasMore, loadingMore, fetchReviews, loadMore, createReview, updateReview, removeReview }
}
