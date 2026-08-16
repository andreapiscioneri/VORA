import { z } from 'zod'
import { getEmailProvider } from '~/server/services/email'
import { getWhatsAppProvider } from '~/server/services/whatsapp'
import { createCommunication } from '~/server/utils/communications'
import { requireOrgId } from '~/server/utils/auth'

const sendSchema = z.object({
  channel: z.enum(['email', 'whatsapp']),
  to: z.string().trim().min(1, 'validation.required'),
  contactId: z.string().nullable().default(null),
  subject: z.string().trim().max(200).default(''),
  body: z.string().trim().min(1, 'validation.required').max(8000),
  threadId: z.string().nullable().default(null),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = sendSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const { channel, to, contactId, subject, body: message, threadId } = result.data

  const sendResult =
    channel === 'email'
      ? await getEmailProvider().send({ to, subject, body: message })
      : await getWhatsAppProvider().send({ to, body: message })

  const communication = await createCommunication(
    {
      channel,
      direction: 'outbound',
      contactId,
      subject,
      body: message,
      status: 'read',
      sentAt: new Date().toISOString(),
      threadId,
      labels: [],
    },
    await requireOrgId(event),
  )

  return { communication, provider: sendResult }
})
