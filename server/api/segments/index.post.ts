import { segmentInputSchema } from '~/shared/validation/segment'
import { createSegment } from '~/server/utils/segments'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = segmentInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createSegment(result.data, await requireOrgId(event))
})
