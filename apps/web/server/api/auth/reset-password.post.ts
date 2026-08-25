import { resetPasswordSchema } from '~/shared/validation/auth'
import { updatePasswordHash } from '~/server/utils/auth'
import { consumeAuthToken } from '~/server/utils/authTokens'
import { revokeAllRefreshTokensForUser } from '~/server/utils/mobileTokens'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = resetPasswordSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const userId = await consumeAuthToken(result.data.token, 'reset-password')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired reset link' })
  }

  const passwordHash = await hashPassword(result.data.password)
  await updatePasswordHash(userId, passwordHash)
  // A password reset must end every existing mobile session too — otherwise
  // a device that had a refresh token before the reset (e.g. a stolen one,
  // which is the scenario a reset is often responding to) would keep working.
  await revokeAllRefreshTokensForUser(userId)

  return { success: true }
})
