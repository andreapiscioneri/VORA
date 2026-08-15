import { listOpportunities } from '~/server/utils/opportunities'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listOpportunities(await requireOrgId(event))
})
