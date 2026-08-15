import { changePasswordSchema } from '~/shared/validation/auth'
import { updatePasswordHash, verifyCredentials } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { logAction } from '~/server/utils/auditLog'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, 'auth:change-password', { max: 5, windowMs: 10 * 60 * 1000 })

  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  const result = changePasswordSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const verified = await verifyCredentials(user.email, result.data.currentPassword)
  if (!verified) {
    throw createError({ statusCode: 401, statusMessage: 'auth.currentPasswordIncorrect' })
  }

  const passwordHash = await hashPassword(result.data.newPassword)
  await updatePasswordHash(user.id, passwordHash)
  await logAction(user.organizationId, user.id, user.name, 'password.change', 'user', user.id)

  return { success: true }
})
