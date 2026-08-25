import { rotateRefreshToken, signAccessToken } from '~/server/utils/mobileTokens'
import { checkRateLimit } from '~/server/utils/rateLimit'

// Called by the mobile app when a Bearer request comes back 401 with an
// expired access token (see apps/mobile/lib/api.ts) — trades the current
// refresh token for a new access+refresh pair. Rotation means the old
// refresh token stops working the moment this succeeds; a client retrying
// with a stale one after a successful refresh is treated the same as any
// other invalid token (401), not a special case.
export default defineEventHandler(async (event) => {
  checkRateLimit(event, 'auth:mobile-refresh', { max: 30, windowMs: 5 * 60 * 1000 })

  const body = await readBody(event)
  const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : null
  if (!refreshToken) {
    throw createError({ statusCode: 422, statusMessage: 'Missing refreshToken' })
  }

  const rotated = await rotateRefreshToken(refreshToken)
  if (!rotated) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired refresh token' })
  }

  const { token: accessToken, expiresAt } = signAccessToken(rotated.userId)

  return { accessToken, accessTokenExpiresAt: expiresAt, refreshToken: rotated.refreshToken }
})
