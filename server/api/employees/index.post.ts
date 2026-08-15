import { employeeInputSchema } from '~/shared/validation/employee'
import { createEmployee } from '~/server/utils/employees'
import { requireRole } from '~/server/utils/auth'
import { logAction } from '~/server/utils/auditLog'

// Employee management is an owner/admin action — a regular member
// shouldn't be able to add/remove headcount records for the organization.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = employeeInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const organizationId = await requireRole(event, ['owner', 'admin'])
  const { user } = await requireUserSession(event)
  const employee = await createEmployee(result.data, organizationId)
  await logAction(organizationId, user.id, user.name, 'employee.create', 'employee', employee.id)
  return employee
})
