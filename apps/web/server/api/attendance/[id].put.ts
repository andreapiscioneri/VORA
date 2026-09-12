import { attendanceEntryInputSchema } from '~/shared/validation/attendance'
import { updateAttendanceEntry } from '~/server/utils/attendance'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = attendanceEntryInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await updateAttendanceEntry(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Attendance entry not found' })
  }

  return updated
})
