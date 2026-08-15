import { getEmployee } from '~/server/utils/employees'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const employee = await getEmployee(id, await requireOrgId(event))

  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  return employee
})
