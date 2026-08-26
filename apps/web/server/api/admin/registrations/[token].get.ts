import { requireSuperadmin, findUserById } from '~/server/utils/auth'
import { peekAuthToken } from '~/server/utils/authTokens'

// Read-only: lets the review page show who a pending token belongs to
// before the admin commits to approve/reject. Does not consume the token.
export default defineEventHandler(async (event) => {
  await requireSuperadmin(event)

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 422, statusMessage: 'token is required' })
  }

  const peeked = await peekAuthToken(token, 'registration-review')
  if (!peeked) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired review link' })
  }

  const user = await findUserById(peeked.userId)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Account no longer exists' })
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    status: user.status,
  }
})
