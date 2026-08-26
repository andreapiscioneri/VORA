import { requireSuperadmin, setUserStatus, findUserById } from '~/server/utils/auth'
import { consumeAuthToken } from '~/server/utils/authTokens'

export default defineEventHandler(async (event) => {
  await requireSuperadmin(event)

  const body = await readBody<{ token?: string }>(event)
  if (!body?.token) {
    throw createError({ statusCode: 422, statusMessage: 'token is required' })
  }

  const userId = await consumeAuthToken(body.token, 'registration-review')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired review link' })
  }

  const user = await findUserById(userId)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Account no longer exists' })
  }

  await setUserStatus(userId, 'rejected')

  return { success: true, user: { id: user.id, name: user.name, email: user.email } }
})
