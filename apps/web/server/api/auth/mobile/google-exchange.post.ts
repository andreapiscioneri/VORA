import { consumeAuthToken } from '~/server/utils/authTokens'
import { findUserById, getPrimaryMembership } from '~/server/utils/auth'
import { signAccessToken, createRefreshToken } from '~/server/utils/mobileTokens'
import { checkRateLimit } from '~/server/utils/rateLimit'

// Trades the one-time code minted by GET /api/auth/google-mobile (see that
// file for why this two-step handoff exists) for a real session — called by
// the mobile app's own `fetch`. Returns a bearer access+refresh token pair
// (see server/utils/mobileTokens.ts), same shape as login.post.ts in this
// folder, rather than a session cookie.
export default defineEventHandler(async (event) => {
  checkRateLimit(event, 'auth:mobile-google-exchange', { max: 10, windowMs: 5 * 60 * 1000 })

  const body = await readBody(event)
  const code = typeof body?.code === 'string' ? body.code : null
  if (!code) {
    throw createError({ statusCode: 422, statusMessage: 'Missing code' })
  }

  const userId = await consumeAuthToken(code, 'mobile-oauth-exchange')
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired code' })
  }

  const user = await findUserById(userId)
  const membership = user ? await getPrimaryMembership(user.id) : null
  if (!user || !membership) {
    throw createError({ statusCode: 401, statusMessage: 'Account no longer available' })
  }

  const { token: accessToken, expiresAt } = signAccessToken(user.id)
  const refreshToken = await createRefreshToken(user.id)

  return {
    user: { ...user, organizationId: membership.organizationId, organizationName: membership.organizationName, role: membership.role },
    accessToken,
    accessTokenExpiresAt: expiresAt,
    refreshToken,
  }
})
