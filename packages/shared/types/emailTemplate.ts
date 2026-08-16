export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  createdAt: string
  updatedAt: string
}

export type EmailTemplateInput = Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>
