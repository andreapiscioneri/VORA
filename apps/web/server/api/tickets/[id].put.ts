import { ticketInputSchema } from '~/shared/validation/ticket'
import { updateTicket } from '~/server/utils/tickets'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = ticketInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await updateTicket(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
  }

  return updated
})
