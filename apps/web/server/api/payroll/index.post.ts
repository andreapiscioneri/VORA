import { payrollRecordInputSchema } from '~/shared/validation/payroll'
import { createPayrollRecord } from '~/server/utils/payroll'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = payrollRecordInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createPayrollRecord(result.data, await requireOrgId(event))
})
