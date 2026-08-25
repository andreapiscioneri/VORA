import { requireRole } from '~/server/utils/auth'
import { listAuditLog } from '~/server/utils/auditLog'
import { parsePaginationParams } from '~/server/utils/pagination'

export default defineEventHandler(async (event) => {
  const organizationId = await requireRole(event, ['owner', 'admin'])
  const { cursor, pageSize } = parsePaginationParams(event)
  return await listAuditLog(organizationId, { cursor, pageSize })
})
