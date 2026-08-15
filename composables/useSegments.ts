import type { Contact } from '~/shared/types/contact'
import type { Segment, SegmentInput } from '~/shared/types/segment'

export function useSegments() {
  const segments = useState<Segment[]>('segments', () => [])
  const pending = useState('segments-pending', () => false)
  const error = useState<string | null>('segments-error', () => null)

  async function fetchSegments() {
    pending.value = true
    error.value = null
    try {
      segments.value = await $fetch<Segment[]>('/api/segments')
    } catch {
      error.value = 'segments.errors.load'
    } finally {
      pending.value = false
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

  return { segments, pending, error, fetchSegments, createSegment, updateSegment, removeSegment, resolveSegment }
}
