import { listCommunications } from '~/server/utils/communications'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listCommunications(await requireOrgId(event))
})
