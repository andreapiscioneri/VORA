import { consumeAuthToken } from '~/server/utils/authTokens'
import { markEmailVerified } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string }>(event)
  if (!body?.token) {
    throw createError({ statusCode: 422, statusMessage: 'token is required' })
  }

  const userId = await consumeAuthToken(body.token, 'verify-email')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired verification link' })
  }

  await markEmailVerified(userId)

  // If the click happens in the same browser session that registered (the
  // common case), reflect it immediately instead of waiting for next
  // login — same reasoning as the role-change note in SECURITY.md, but
  // here we *can* update in place since we're already inside the request
  // that just changed the underlying fact.
  const session = await getUserSession(event)
  if (session.user?.id === userId) {
    await setUserSession(event, { user: { ...session.user, emailVerified: true } })
  }

  return { success: true }
})
