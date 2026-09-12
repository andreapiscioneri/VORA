import { listAttendance } from '~/server/utils/attendance'
import { requireOrgId } from '~/server/utils/auth'
import { parsePaginationParams } from '~/server/utils/pagination'

export default defineEventHandler(async (event) => {
  const organizationId = await requireOrgId(event)
  const { cursor, pageSize } = parsePaginationParams(event)
  return await listAttendance(organizationId, { cursor, pageSize })
})
