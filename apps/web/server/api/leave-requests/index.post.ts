import { leaveRequestInputSchema } from '~/shared/validation/leave'
import { createLeaveRequest } from '~/server/utils/leave'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = leaveRequestInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createLeaveRequest(result.data, await requireOrgId(event))
})
