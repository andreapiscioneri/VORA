import { listSegments } from '~/server/utils/segments'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listSegments(await requireOrgId(event))
})
