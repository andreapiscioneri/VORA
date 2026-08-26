import { loginSchema } from '~/shared/validation/auth'
import { verifyCredentials, getPrimaryMembership, isApproved } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { logAction } from '~/server/utils/auditLog'

export default defineEventHandler(async (event) => {
  // 10 attempts / 5 minutes per IP — generous enough for a genuine typo or
  // two, tight enough to make credential-stuffing impractical.
  checkRateLimit(event, 'auth:login', { max: 10, windowMs: 5 * 60 * 1000 })

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

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      organizationId: membership.organizationId,
      organizationName: membership.organizationName,
      role: membership.role,
      platformRole: user.platformRole,
    },
  })

  await logAction(membership.organizationId, user.id, user.name, 'login', 'session')

  return { user, organization: { id: membership.organizationId, name: membership.organizationName } }
})
