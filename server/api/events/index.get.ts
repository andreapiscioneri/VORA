import { listEvents } from '~/server/utils/events'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listEvents(await requireOrgId(event))
})
