import { attendanceEntryInputSchema } from '~/shared/validation/attendance'
import { createAttendanceEntry } from '~/server/utils/attendance'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = attendanceEntryInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createAttendanceEntry(result.data, await requireOrgId(event))
})
