import { welfareInitiativeInputSchema } from '~/shared/validation/welfare'
import { createWelfareInitiative } from '~/server/utils/welfare'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = welfareInitiativeInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createWelfareInitiative(result.data, await requireOrgId(event))
})
