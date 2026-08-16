import { opportunityInputSchema } from '~/shared/validation/opportunity'
import { createOpportunity } from '~/server/utils/opportunities'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = opportunityInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createOpportunity(result.data, await requireOrgId(event))
})
