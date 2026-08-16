import { deleteSegment } from '~/server/utils/segments'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteSegment(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Segment not found' })
  }

  return { success: true }
})
