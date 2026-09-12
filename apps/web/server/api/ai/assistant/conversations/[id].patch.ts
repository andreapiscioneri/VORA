import { z } from 'zod'
import { resolveSession } from '~/server/utils/auth'
import { renameConversation, setConversationArchived } from '~/server/utils/assistantConversations'

const schema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  archived: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const { organizationId, id: userId } = session.user
  let conversation = null

  if (result.data.title !== undefined) {
    conversation = await renameConversation(id, organizationId, userId, result.data.title)
    if (!conversation) throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }

  if (result.data.archived !== undefined) {
    conversation = await setConversationArchived(id, organizationId, userId, result.data.archived)
    if (!conversation) throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }

  if (!conversation) throw createError({ statusCode: 422, statusMessage: 'Nothing to update' })
  return conversation
})
