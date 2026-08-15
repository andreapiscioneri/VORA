import { microSiteInputSchema } from '~/shared/validation/microsite'
import { isSlugTaken, updateSite } from '~/server/utils/microsites'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = microSiteInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  if (await isSlugTaken(result.data.slug, id)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: { fieldErrors: { slug: ['validation.slugTaken'] } },
    })
  }

  const updated = await updateSite(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Site not found' })
  }

  return updated
})
