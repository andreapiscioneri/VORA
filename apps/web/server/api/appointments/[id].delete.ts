import { deleteAppointment } from '~/server/utils/appointments'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteAppointment(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Appointment not found' })
  }

  return { success: true }
})
