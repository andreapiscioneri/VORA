import { listTickets } from '~/server/utils/tickets'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listTickets(await requireOrgId(event))
})
