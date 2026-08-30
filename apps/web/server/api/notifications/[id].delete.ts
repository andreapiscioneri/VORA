import { deleteAppNotification } from '~/server/utils/appNotifications'
import { resolveSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  const id = getRouterParam(event, 'id')!
  const deleted = await deleteAppNotification(id, session.user.id)

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Notification not found' })
  }

  return { success: true }
})
