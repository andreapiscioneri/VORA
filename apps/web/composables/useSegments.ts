import type { Contact } from '~/shared/types/contact'
import type { Segment, SegmentInput } from '~/shared/types/segment'
import type { PageResult } from '~/server/utils/pagination'

export function useSegments() {
  const segments = useState<Segment[]>('segments', () => [])
  const pending = useState('segments-pending', () => false)
  const loadingMore = useState('segments-loading-more', () => false)
  const error = useState<string | null>('segments-error', () => null)
  const nextCursor = useState<string | null>('segments-cursor', () => null)
  const hasMore = useState('segments-has-more', () => false)

  async function fetchSegments() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<Segment>>('/api/segments')
      segments.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'segments.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<Segment>>('/api/segments', { query: { cursor: nextCursor.value } })
      segments.value = [...segments.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createSegment(input: SegmentInput) {
    const created = await $fetch<Segment>('/api/segments', { method: 'POST', body: input })
    segments.value = [created, ...segments.value]
    return created
  }

  async function updateSegment(id: string, input: SegmentInput) {
    const updated = await $fetch<Segment>(`/api/segments/${id}`, { method: 'PUT', body: input })
    segments.value = segments.value.map((s) => (s.id === id ? updated : s))
    return updated
  }

  async function removeSegment(id: string) {
    await $fetch(`/api/segments/${id}`, { method: 'DELETE' })
    segments.value = segments.value.filter((s) => s.id !== id)
  }

  async function resolveSegment(id: string) {
    return await $fetch<{ contacts: Contact[]; count: number }>(`/api/segments/${id}/resolve`)
  }

  return { segments, pending, error, hasMore, loadingMore, fetchSegments, loadMore, createSegment, updateSegment, removeSegment, resolveSegment }
}
