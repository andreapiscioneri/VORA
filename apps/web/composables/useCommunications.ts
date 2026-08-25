import type { Communication, CommunicationStatus } from '~/shared/types/communication'
import type { PageResult } from '~/server/utils/pagination'

export function useCommunications() {
  const communications = useState<Communication[]>('communications', () => [])
  const pending = useState('communications-pending', () => false)
  const loadingMore = useState('communications-loading-more', () => false)
  const error = useState<string | null>('communications-error', () => null)
  const nextCursor = useState<string | null>('communications-cursor', () => null)
  const hasMore = useState('communications-has-more', () => false)

  async function fetchCommunications() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<Communication>>('/api/communications')
      communications.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'inbox.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<Communication>>('/api/communications', { query: { cursor: nextCursor.value } })
      communications.value = [...communications.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function sendMessage(payload: {
    channel: 'email' | 'whatsapp'
    to: string
    contactId: string | null
    subject: string
    body: string
    threadId?: string | null
    attachments?: { title: string; url: string }[]
  }) {
    const result = await $fetch<{ communication: Communication }>('/api/communications/send', { method: 'POST', body: payload })
    communications.value = [result.communication, ...communications.value]
    return result.communication
  }

  async function setStatus(id: string, status: CommunicationStatus) {
    const updated = await $fetch<Communication>(`/api/communications/${id}`, { method: 'PUT', body: { status } })
    communications.value = communications.value.map((c) => (c.id === id ? updated : c))
    return updated
  }

  async function setLabels(id: string, labels: string[]) {
    const updated = await $fetch<Communication>(`/api/communications/${id}`, { method: 'PUT', body: { labels } })
    communications.value = communications.value.map((c) => (c.id === id ? updated : c))
    return updated
  }

  async function removeCommunication(id: string) {
    await $fetch(`/api/communications/${id}`, { method: 'DELETE' })
    communications.value = communications.value.filter((c) => c.id !== id)
  }

  return { communications, pending, error, hasMore, loadingMore, fetchCommunications, loadMore, sendMessage, setStatus, setLabels, removeCommunication }
}
