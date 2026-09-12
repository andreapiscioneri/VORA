import { ticketInputSchema } from '~/shared/validation/ticket'
import { getTicket, updateTicket } from '~/server/utils/tickets'
import { requireOrgId } from '~/server/utils/auth'
import { resolveEmployeeUserId } from '~/server/utils/employees'
import { sendPushToUser } from '~/server/services/notifications'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = ticketInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const organizationId = await requireOrgId(event)
  const existing = await getTicket(id, organizationId)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
  }

  const updated = await updateTicket(id, result.data, organizationId)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
  }

  const assigneeChanged = updated.assigneeId && updated.assigneeId !== existing.assigneeId
  if (assigneeChanged) {
    const assigneeUserId = await resolveEmployeeUserId(updated.assigneeId, organizationId)
    if (assigneeUserId) {
      await sendPushToUser(assigneeUserId, 'tickets', {
        title: 'Nuovo ticket assegnato',
        body: updated.title,
        data: { type: 'ticket', ticketId: id },
      })
    }
  }

  return updated
})
