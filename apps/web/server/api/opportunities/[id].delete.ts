import { deleteOpportunity } from '~/server/utils/opportunities'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteOpportunity(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Opportunity not found' })
  }

  return { success: true }
})
