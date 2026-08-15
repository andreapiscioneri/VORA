import type { Ticket, TicketInput } from '~/shared/types/ticket'

export function useTickets() {
  const tickets = useState<Ticket[]>('tickets', () => [])
  const pending = useState('tickets-pending', () => false)
  const error = useState<string | null>('tickets-error', () => null)

  async function fetchTickets() {
    pending.value = true
    error.value = null
    try {
      tickets.value = await $fetch<Ticket[]>('/api/tickets')
    } catch {
      error.value = 'helpdesk.errors.load'
    } finally {
      pending.value = false
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

  return { tickets, pending, error, fetchTickets, createTicket, updateTicket, addComment, removeTicket, addAttachment }
}
