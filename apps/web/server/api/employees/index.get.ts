import { listEmployees } from '~/server/utils/employees'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listEmployees(await requireOrgId(event))
})
