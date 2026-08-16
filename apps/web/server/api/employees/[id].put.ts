import { employeeInputSchema } from '~/shared/validation/employee'
import { updateEmployee } from '~/server/utils/employees'
import { requireRole } from '~/server/utils/auth'
import { logAction } from '~/server/utils/auditLog'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = employeeInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const organizationId = await requireRole(event, ['owner', 'admin'])
  const updated = await updateEmployee(id, result.data, organizationId)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const { user } = await requireUserSession(event)
  await logAction(organizationId, user.id, user.name, 'employee.update', 'employee', id)

  return updated
})
