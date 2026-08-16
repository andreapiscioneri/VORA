import { knowledgeDocumentInputSchema } from '~/shared/validation/knowledge'
import { createDocument } from '~/server/utils/knowledge'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = knowledgeDocumentInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createDocument(result.data, await requireOrgId(event))
})
