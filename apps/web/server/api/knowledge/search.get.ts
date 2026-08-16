import { searchDocuments } from '~/server/utils/knowledge'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q : ''
  return await searchDocuments(await requireOrgId(event), q)
})
