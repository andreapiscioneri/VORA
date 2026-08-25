import { listMessages } from '~/server/utils/wellbeingChat'
import { resolveSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
  return await listMessages(user.organizationId, user.id)
})
