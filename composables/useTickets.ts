import type { Ticket, TicketInput } from '~/shared/types/ticket'
import type { PageResult } from '~/server/utils/pagination'

export function useTickets() {
  const tickets = useState<Ticket[]>('tickets', () => [])
  const pending = useState('tickets-pending', () => false)
  const loadingMore = useState('tickets-loading-more', () => false)
  const error = useState<string | null>('tickets-error', () => null)
  const nextCursor = useState<string | null>('tickets-cursor', () => null)
  const hasMore = useState('tickets-has-more', () => false)

  async function fetchTickets() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<Ticket>>('/api/tickets')
      tickets.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'helpdesk.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<Ticket>>('/api/tickets', { query: { cursor: nextCursor.value } })
      tickets.value = [...tickets.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createTicket(input: TicketInput) {
    const created = await $fetch<Ticket>('/api/tickets', { method: 'POST', body: input })
    tickets.value = [created, ...tickets.value]
    return created
  }

  async function updateTicket(id: string, input: TicketInput) {
    const updated = await $fetch<Ticket>(`/api/tickets/${id}`, { method: 'PUT', body: input })
    tickets.value = tickets.value.map((t) => (t.id === id ? updated : t))
    return updated
  }

  async function addComment(ticket: Ticket, body: string) {
    const { id, createdAt, updatedAt, ...input } = ticket
    const comment = { id: crypto.randomUUID(), body, createdAt: new Date().toISOString() }
    return await updateTicket(id, { ...input, comments: [...input.comments, comment] })
  }

  async function removeTicket(id: string) {
    await $fetch(`/api/tickets/${id}`, { method: 'DELETE' })
    tickets.value = tickets.value.filter((t) => t.id !== id)
  }

  async function addAttachment(ticketId: string, title: string, url: string) {
    return await $fetch<Ticket>(`/api/tickets/${ticketId}/attachments`, { method: 'POST', body: { title, url } })
  }

  return { tickets, pending, error, hasMore, loadingMore, fetchTickets, loadMore, createTicket, updateTicket, addComment, removeTicket, addAttachment }
}
