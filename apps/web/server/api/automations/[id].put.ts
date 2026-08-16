import { automationInputSchema } from '~/shared/validation/automation'
import { updateAutomation } from '~/server/utils/automations'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = automationInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await updateAutomation(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Automation not found' })
  }

  return updated
})
