import { resolveSession } from '~/server/utils/auth'
import { deleteConversation } from '~/server/utils/assistantConversations'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  const id = getRouterParam(event, 'id')!
  const deleted = await deleteConversation(id, session.user.organizationId, session.user.id)
  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  return { success: true }
})
