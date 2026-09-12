import { performanceReviewInputSchema } from '~/shared/validation/performanceReview'
import { updatePerformanceReview } from '~/server/utils/performanceReviews'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = performanceReviewInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await updatePerformanceReview(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Review not found' })
  }

  return updated
})
