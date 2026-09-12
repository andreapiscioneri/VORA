import { deletePerformanceReview } from '~/server/utils/performanceReviews'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deletePerformanceReview(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Review not found' })
  }

  return { success: true }
})
