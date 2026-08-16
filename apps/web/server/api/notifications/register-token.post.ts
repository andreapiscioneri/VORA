import { pushTokenInputSchema } from '~/shared/validation/notification'
import { registerPushToken } from '~/server/utils/pushTokens'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  const result = pushTokenInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await registerPushToken(result.data, user.id)
})
