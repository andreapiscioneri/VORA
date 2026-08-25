import { pushTokenInputSchema } from '~/shared/validation/notification'
import { registerPushToken } from '~/server/utils/pushTokens'
import { resolveSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
  const body = await readBody(event)
  const result = pushTokenInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await registerPushToken(result.data, user.id)
})
