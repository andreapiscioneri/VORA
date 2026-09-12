import { candidateInputSchema } from '~/shared/validation/candidate'
import { createCandidate } from '~/server/utils/candidates'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = candidateInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createCandidate(result.data, await requireOrgId(event))
})
