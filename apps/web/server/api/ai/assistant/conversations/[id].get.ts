import { resolveSession } from '~/server/utils/auth'
import { getConversation } from '~/server/utils/assistantConversations'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  const id = getRouterParam(event, 'id')!
  const conversation = await getConversation(id, session.user.organizationId, session.user.id)
  if (!conversation) throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  return conversation
})
