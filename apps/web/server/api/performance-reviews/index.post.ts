import { performanceReviewInputSchema } from '~/shared/validation/performanceReview'
import { createPerformanceReview } from '~/server/utils/performanceReviews'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = performanceReviewInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createPerformanceReview(result.data, await requireOrgId(event))
})
