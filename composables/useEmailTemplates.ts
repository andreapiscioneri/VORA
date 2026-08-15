import type { EmailTemplate, EmailTemplateInput } from '~/shared/types/emailTemplate'

export function useEmailTemplates() {
  const templates = useState<EmailTemplate[]>('email-templates', () => [])
  const pending = useState('email-templates-pending', () => false)
  const error = useState<string | null>('email-templates-error', () => null)

  async function fetchTemplates() {
    pending.value = true
    error.value = null
    try {
      templates.value = await $fetch<EmailTemplate[]>('/api/email-templates')
    } catch {
      error.value = 'templates.errors.load'
    } finally {
      pending.value = false
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

  return { templates, pending, error, fetchTemplates, createTemplate, updateTemplate, removeTemplate }
}
