import { loginSchema } from '~/shared/validation/auth'
import { verifyCredentials, getPrimaryMembership, isApproved } from '~/server/utils/auth'
import { signAccessToken, createRefreshToken } from '~/server/utils/mobileTokens'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { logAction } from '~/server/utils/auditLog'

// Mobile-only counterpart to /api/auth/login.post.ts: same credential
// check, but returns a bearer access+refresh token pair instead of setting
// a session cookie (see server/utils/mobileTokens.ts for why mobile needs
// its own real session mechanism rather than relying on RN's fetch cookie
// jar). Kept as a separate route rather than a branch in login.post.ts so
// neither client's response shape has to account for the other's.
export default defineEventHandler(async (event) => {
  checkRateLimit(event, 'auth:mobile-login', { max: 10, windowMs: 5 * 60 * 1000 })

  const body = await readBody(event)
  const result = loginSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const user = await verifyCredentials(result.data.email, result.data.password)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  if (!isApproved(user)) {
    throw createError({ statusCode: 403, statusMessage: 'Account pending approval', data: { reason: 'pending_approval' } })
  }

  const membership = await getPrimaryMembership(user.id)
  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'User has no organization' })
  }

  const { token: accessToken, expiresAt } = signAccessToken(user.id)
  const refreshToken = await createRefreshToken(user.id)

  await logAction(membership.organizationId, user.id, user.name, 'login', 'session')

  return {
    user: { ...user, organizationId: membership.organizationId, organizationName: membership.organizationName, role: membership.role },
    accessToken,
    accessTokenExpiresAt: expiresAt,
    refreshToken,
  }
})
