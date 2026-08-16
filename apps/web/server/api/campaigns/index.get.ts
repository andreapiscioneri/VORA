import { listCampaigns } from '~/server/utils/campaigns'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listCampaigns(await requireOrgId(event))
})
