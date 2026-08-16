import { getTicket } from '~/server/utils/tickets'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const ticket = await getTicket(id, await requireOrgId(event))

  if (!ticket) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
  }

  return ticket
})
