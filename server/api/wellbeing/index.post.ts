import { wellbeingCheckInInputSchema } from '~/shared/validation/wellbeing'
import { upsertCheckIn } from '~/server/utils/wellbeing'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  const result = wellbeingCheckInInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await upsertCheckIn(result.data, user.organizationId, user.id)
})
