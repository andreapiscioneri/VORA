import { z } from 'zod'
import { resolveSession } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { createConversation } from '~/server/utils/assistantConversations'

const schema = z.object({ title: z.string().trim().min(1).max(120).default('New conversation') })

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  checkRateLimit(event, 'ai:assistant:create', { max: 30, windowMs: 10 * 60 * 1000 })

  const body = await readBody(event).catch(() => ({}))
  const result = schema.safeParse(body ?? {})
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return createConversation(session.user.organizationId, session.user.id, result.data.title)
})
