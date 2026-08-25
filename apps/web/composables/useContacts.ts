import type { Contact, ContactInput } from '~/shared/types/contact'
import type { PageResult } from '~/server/utils/pagination'

export function useContacts() {
  const contacts = useState<Contact[]>('contacts', () => [])
  const pending = useState('contacts-pending', () => false)
  const loadingMore = useState('contacts-loading-more', () => false)
  const error = useState<string | null>('contacts-error', () => null)
  const nextCursor = useState<string | null>('contacts-cursor', () => null)
  const hasMore = useState('contacts-has-more', () => false)

  async function fetchContacts() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<Contact>>('/api/contacts')
      contacts.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'contacts.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<Contact>>('/api/contacts', { query: { cursor: nextCursor.value } })
      contacts.value = [...contacts.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createContact(input: ContactInput) {
    const created = await $fetch<Contact>('/api/contacts', { method: 'POST', body: input })
    contacts.value = [created, ...contacts.value]
    return created
  }

  async function updateContact(id: string, input: ContactInput) {
    const updated = await $fetch<Contact>(`/api/contacts/${id}`, { method: 'PUT', body: input })
    contacts.value = contacts.value.map((c) => (c.id === id ? updated : c))
    return updated
  }

  async function removeContact(id: string) {
    await $fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    contacts.value = contacts.value.filter((c) => c.id !== id)
  }

  async function addAttachment(contactId: string, title: string, url: string) {
    return await $fetch<Contact>(`/api/contacts/${contactId}/attachments`, { method: 'POST', body: { title, url } })
  }

  return { contacts, pending, error, hasMore, loadingMore, fetchContacts, loadMore, createContact, updateContact, removeContact, addAttachment }
}
