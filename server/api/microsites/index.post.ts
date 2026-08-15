import { microSiteInputSchema } from '~/shared/validation/microsite'
import { createSite, isSlugTaken } from '~/server/utils/microsites'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = microSiteInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  if (await isSlugTaken(result.data.slug)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: { fieldErrors: { slug: ['validation.slugTaken'] } },
    })
  }

  return await createSite(result.data, await requireOrgId(event))
})
