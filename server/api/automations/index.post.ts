import { automationInputSchema } from '~/shared/validation/automation'
import { createAutomation } from '~/server/utils/automations'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = automationInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createAutomation(result.data, await requireOrgId(event))
})
