import { resolveSession } from '~/server/utils/auth'
import { listConversations } from '~/server/utils/assistantConversations'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  const query = getQuery(event)
  const archived = query.archived === 'true'
  const q = typeof query.q === 'string' ? query.q : undefined

  return listConversations(session.user.organizationId, session.user.id, { archived, query: q })
})
