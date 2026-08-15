import { appointmentInputSchema } from '~/shared/validation/appointment'
import { createAppointment } from '~/server/utils/appointments'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = appointmentInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createAppointment(result.data, await requireOrgId(event))
})
