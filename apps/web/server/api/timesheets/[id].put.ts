import { timesheetEntryInputSchema } from '~/shared/validation/timesheet'
import { updateEntry } from '~/server/utils/timesheets'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = timesheetEntryInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await updateEntry(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Entry not found' })
  }

  return updated
})
