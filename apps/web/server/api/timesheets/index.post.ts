import { timesheetEntryInputSchema } from '~/shared/validation/timesheet'
import { createEntry } from '~/server/utils/timesheets'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = timesheetEntryInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createEntry(result.data, await requireOrgId(event))
})
