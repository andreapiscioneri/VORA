import { deleteEmployee } from '~/server/utils/employees'
import { requireRole } from '~/server/utils/auth'
import { logAction } from '~/server/utils/auditLog'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const organizationId = await requireRole(event, ['owner', 'admin'])
  const deleted = await deleteEmployee(id, organizationId)

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const { user } = await requireUserSession(event)
  await logAction(organizationId, user.id, user.name, 'employee.delete', 'employee', id)

  return { success: true }
})
