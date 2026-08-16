import { resetPasswordSchema } from '~/shared/validation/auth'
import { updatePasswordHash } from '~/server/utils/auth'
import { consumeAuthToken } from '~/server/utils/authTokens'

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

  return { success: true }
})
