import { deleteAttendanceEntry } from '~/server/utils/attendance'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteAttendanceEntry(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Attendance entry not found' })
  }

  return { success: true }
})
