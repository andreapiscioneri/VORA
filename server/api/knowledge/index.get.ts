import { listDocuments } from '~/server/utils/knowledge'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listDocuments(await requireOrgId(event))
})
