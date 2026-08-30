import { markNotificationSchema } from '~/shared/validation/notification'
import { markAppNotification } from '~/server/utils/appNotifications'
import { resolveSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = markNotificationSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await markAppNotification(id, session.user.id, result.data.read)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Notification not found' })
  }

  return updated
})
