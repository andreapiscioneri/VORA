import type { EmailTemplate, EmailTemplateInput } from '~/shared/types/emailTemplate'
import type { PageResult } from '~/server/utils/pagination'

export function useEmailTemplates() {
  const templates = useState<EmailTemplate[]>('email-templates', () => [])
  const pending = useState('email-templates-pending', () => false)
  const loadingMore = useState('email-templates-loading-more', () => false)
  const error = useState<string | null>('email-templates-error', () => null)
  const nextCursor = useState<string | null>('email-templates-cursor', () => null)
  const hasMore = useState('email-templates-has-more', () => false)

  async function fetchTemplates() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<EmailTemplate>>('/api/email-templates')
      templates.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'templates.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<EmailTemplate>>('/api/email-templates', { query: { cursor: nextCursor.value } })
      templates.value = [...templates.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createTemplate(input: EmailTemplateInput) {
    const created = await $fetch<EmailTemplate>('/api/email-templates', { method: 'POST', body: input })
    templates.value = [created, ...templates.value]
    return created
  }

  async function updateTemplate(id: string, input: EmailTemplateInput) {
    const updated = await $fetch<EmailTemplate>(`/api/email-templates/${id}`, { method: 'PUT', body: input })
    templates.value = templates.value.map((t) => (t.id === id ? updated : t))
    return updated
  }

  async function removeTemplate(id: string) {
    await $fetch(`/api/email-templates/${id}`, { method: 'DELETE' })
    templates.value = templates.value.filter((t) => t.id !== id)
  }

  return { templates, pending, error, hasMore, loadingMore, fetchTemplates, loadMore, createTemplate, updateTemplate, removeTemplate }
}
