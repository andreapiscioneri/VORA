import { resolveSession } from '~/server/utils/auth'
import { searchVora } from '~/server/utils/search'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  const q = getQuery(event).q
  const query = typeof q === 'string' ? q : ''
  return searchVora(session.user.organizationId, query)
})
