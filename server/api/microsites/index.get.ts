import { listSites } from '~/server/utils/microsites'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listSites(await requireOrgId(event))
})
