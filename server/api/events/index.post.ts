import { calendarEventInputSchema } from '~/shared/validation/event'
import { createCalendarEvent } from '~/server/utils/events'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = calendarEventInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createCalendarEvent(result.data, await requireOrgId(event))
})
