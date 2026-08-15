import { getDocument } from '~/server/utils/knowledge'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const doc = await getDocument(id, await requireOrgId(event))

  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  return doc
})
