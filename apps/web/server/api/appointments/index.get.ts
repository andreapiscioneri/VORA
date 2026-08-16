import { listAppointments } from '~/server/utils/appointments'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listAppointments(await requireOrgId(event))
})
