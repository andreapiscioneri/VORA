import { campaignInputSchema } from '~/shared/validation/campaign'
import { createCampaign } from '~/server/utils/campaigns'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = campaignInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createCampaign(result.data, await requireOrgId(event))
})
