import { unregisterPushToken } from '~/server/utils/pushTokens'
import { resolveSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
  const body = await readBody<{ token?: string }>(event)
  if (!body?.token) {
    throw createError({ statusCode: 422, statusMessage: 'token is required' })
  }
  const removed = await unregisterPushToken(body.token, user.id)
  return { success: removed }
})
