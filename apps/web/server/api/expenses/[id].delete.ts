import { deleteExpense } from '~/server/utils/expenses'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteExpense(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Expense not found' })
  }

  return { success: true }
})
