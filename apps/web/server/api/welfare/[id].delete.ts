import { deleteWelfareInitiative } from '~/server/utils/welfare'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteWelfareInitiative(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Initiative not found' })
  }

  return { success: true }
})
