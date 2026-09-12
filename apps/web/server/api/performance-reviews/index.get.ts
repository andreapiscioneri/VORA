import { listPerformanceReviews } from '~/server/utils/performanceReviews'
import { requireOrgId } from '~/server/utils/auth'
import { parsePaginationParams } from '~/server/utils/pagination'

export default defineEventHandler(async (event) => {
  const organizationId = await requireOrgId(event)
  const { cursor, pageSize } = parsePaginationParams(event)
  return await listPerformanceReviews(organizationId, { cursor, pageSize })
})
