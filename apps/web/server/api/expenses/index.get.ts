import { listExpenses } from '~/server/utils/expenses'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listExpenses(await requireOrgId(event))
})
