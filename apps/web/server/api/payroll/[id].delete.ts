import { deletePayrollRecord } from '~/server/utils/payroll'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deletePayrollRecord(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Record not found' })
  }

  return { success: true }
})
