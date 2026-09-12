import { listWelfareInitiatives } from '~/server/utils/welfare'
import { requireOrgId } from '~/server/utils/auth'
import { parsePaginationParams } from '~/server/utils/pagination'

export default defineEventHandler(async (event) => {
  const organizationId = await requireOrgId(event)
  const { cursor, pageSize } = parsePaginationParams(event)
  return await listWelfareInitiatives(organizationId, { cursor, pageSize })
})
