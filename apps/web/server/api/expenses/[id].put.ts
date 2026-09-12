import { expenseInputSchema } from '~/shared/validation/expense'
import { getExpense, updateExpense } from '~/server/utils/expenses'
import { requireOrgId, requireRole, resolveSession } from '~/server/utils/auth'
import { logAction } from '~/server/utils/auditLog'
import { sendPushToUser } from '~/server/services/notifications'

// Same pattern as leave-requests: editing a still-pending expense's own
// content is open to any member; changing its status (approve/reject) is
// an owner/admin action, enforced only when the status actually changes.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = expenseInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const organizationId = await requireOrgId(event)
  const existing = await getExpense(id, organizationId)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Expense not found' })
  }

  const statusChanged = result.data.status !== existing.status
  if (statusChanged) {
    await requireRole(event, ['owner', 'admin'])
  }

  const updated = await updateExpense(id, result.data, organizationId)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Expense not found' })
  }

  if (statusChanged && (updated.status === 'approved' || updated.status === 'rejected')) {
    const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
    await logAction(organizationId, user.id, user.name, updated.status === 'approved' ? 'expense.approve' : 'expense.reject', 'expense', id)

    if (updated.submitterId) {
      const approved = updated.status === 'approved'
      await sendPushToUser(updated.submitterId, 'approvals', {
        title: approved ? 'Nota spese approvata' : 'Nota spese rifiutata',
        body: `${updated.category} · ${updated.amount} ${updated.currency}`,
        data: { type: 'expense', expenseId: id },
      })
    }
  }

  return updated
})
