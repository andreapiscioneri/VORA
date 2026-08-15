import { socialPostInputSchema } from '~/shared/validation/social-post'
import { createPost } from '~/server/utils/social-posts'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = socialPostInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createPost(result.data, await requireOrgId(event))
})
