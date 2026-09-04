import { calendarEventInputSchema } from '~/shared/validation/event'
import { createCalendarEvent } from '~/server/utils/events'
import { resolveSession } from '~/server/utils/auth'
import { sendPushToUser } from '~/server/services/notifications'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  const body = await readBody(event)
  const result = calendarEventInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const created = await createCalendarEvent(result.data, session.user.organizationId, session.user.id)

  const when = new Date(created.startAt).toLocaleString()
  await sendPushToUser(session.user.id, 'appointments', {
    title: 'Nuovo evento',
    body: `${created.title} · ${when}`,
    data: { type: 'event', eventId: created.id },
  })

  return created
})
