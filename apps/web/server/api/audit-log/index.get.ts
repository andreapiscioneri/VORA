import { requireRole } from '~/server/utils/auth'
import { listAuditLog } from '~/server/utils/auditLog'

export default defineEventHandler(async (event) => {
  const organizationId = await requireRole(event, ['owner', 'admin'])
  return await listAuditLog(organizationId)
})
