import { notificationPreferencesSchema } from '~/shared/validation/notification'
import { setPreferences } from '~/server/utils/notificationPreferences'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  const result = notificationPreferencesSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await setPreferences(user.id, result.data)
})
