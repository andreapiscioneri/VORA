import { countUnreadAppNotifications } from '~/server/utils/appNotifications'
import { resolveSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const count = await countUnreadAppNotifications(session.user.id)
  return { count }
})
