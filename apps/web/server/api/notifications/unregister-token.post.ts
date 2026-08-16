import { unregisterPushToken } from '~/server/utils/pushTokens'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody<{ token?: string }>(event)
  if (!body?.token) {
    throw createError({ statusCode: 422, statusMessage: 'token is required' })
  }
  const removed = await unregisterPushToken(body.token, user.id)
  return { success: removed }
})
