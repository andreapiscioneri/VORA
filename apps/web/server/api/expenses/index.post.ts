import { expenseInputSchema } from '~/shared/validation/expense'
import { createExpense } from '~/server/utils/expenses'
import { resolveSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  const body = await readBody(event)
  const result = expenseInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createExpense(result.data, session.user.organizationId, session.user.id)
})
