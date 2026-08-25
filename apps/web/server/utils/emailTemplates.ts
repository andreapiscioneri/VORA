import type { EmailTemplate } from '~/shared/types/emailTemplate'
import type { EmailTemplateInputSchema } from '~/shared/validation/emailTemplate'
import { getDb } from './firebase'
import { paginateQuery, type PageResult } from './pagination'

const COLLECTION = 'emailTemplates'

function toTemplate(id: string, data: FirebaseFirestore.DocumentData): EmailTemplate {
  return {
    id,
    name: data.name ?? '',
    subject: data.subject ?? '',
    body: data.body ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}

export async function listEmailTemplates(organizationId: string, params?: { cursor?: string | null; pageSize?: number }): Promise<PageResult<EmailTemplate>> {
  const query = getDb().collection(COLLECTION).where('organizationId', '==', organizationId).orderBy('createdAt', 'desc')
  return paginateQuery(query, COLLECTION, params, toTemplate)
}

export async function getEmailTemplate(id: string, organizationId: string): Promise<EmailTemplate | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get()
  if (!doc.exists || doc.data()?.organizationId !== organizationId) return null
  return toTemplate(doc.id, doc.data()!)
}

export async function createEmailTemplate(input: EmailTemplateInputSchema, organizationId: string): Promise<EmailTemplate> {
  const now = new Date().toISOString()
  const ref = await getDb()
    .collection(COLLECTION)
    .add({ ...input, organizationId, createdAt: now, updatedAt: now })
  return toTemplate(ref.id, { ...input, createdAt: now, updatedAt: now })
}

export async function updateEmailTemplate(id: string, input: EmailTemplateInputSchema, organizationId: string): Promise<EmailTemplate | null> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return null

  const updatedAt = new Date().toISOString()
  await ref.update({ ...input, updatedAt })
  return toTemplate(id, { ...existing.data(), ...input, updatedAt })
}

export async function deleteEmailTemplate(id: string, organizationId: string): Promise<boolean> {
  const ref = getDb().collection(COLLECTION).doc(id)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.organizationId !== organizationId) return false
  await ref.delete()
  return true
}
