import type { Communication, CommunicationStatus } from '~/shared/types/communication'

export function useCommunications() {
  const communications = useState<Communication[]>('communications', () => [])
  const pending = useState('communications-pending', () => false)
  const error = useState<string | null>('communications-error', () => null)

  async function fetchCommunications() {
    pending.value = true
    error.value = null
    try {
      communications.value = await $fetch<Communication[]>('/api/communications')
    } catch {
      error.value = 'inbox.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function sendMessage(payload: { channel: 'email' | 'whatsapp'; to: string; contactId: string | null; subject: string; body: string; threadId?: string | null }) {
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

  return { communications, pending, error, fetchCommunications, sendMessage, setStatus, setLabels, removeCommunication }
}
