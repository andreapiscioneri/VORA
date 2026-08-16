import { deleteCampaign } from '~/server/utils/campaigns'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteCampaign(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
  }

  return { success: true }
})
