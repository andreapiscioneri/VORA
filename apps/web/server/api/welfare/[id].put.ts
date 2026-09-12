import { welfareInitiativeInputSchema } from '~/shared/validation/welfare'
import { updateWelfareInitiative } from '~/server/utils/welfare'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = welfareInitiativeInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await updateWelfareInitiative(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Initiative not found' })
  }

  return updated
})
