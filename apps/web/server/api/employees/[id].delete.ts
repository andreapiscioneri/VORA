import { deleteEmployee } from '~/server/utils/employees'
import { requireRole, resolveSession } from '~/server/utils/auth'
import { logAction } from '~/server/utils/auditLog'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const organizationId = await requireRole(event, ['owner', 'admin'])
  const deleted = await deleteEmployee(id, organizationId)

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
  await logAction(organizationId, user.id, user.name, 'employee.delete', 'employee', id)

  return { success: true }
})
