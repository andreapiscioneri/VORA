import { leaveRequestInputSchema } from '~/shared/validation/leave'
import { getLeaveRequest, updateLeaveRequest } from '~/server/utils/leave'
import { requireOrgId, requireRole, resolveSession } from '~/server/utils/auth'
import { logAction } from '~/server/utils/auditLog'

// Editing a still-pending request's own content is open to any member;
// changing its status (approve/reject) is an owner/admin action — the two
// are the same PUT endpoint (matching the existing UI's edit-or-approve
// flow), so the role check only kicks in when the status actually changes.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = leaveRequestInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const organizationId = await requireOrgId(event)
  const existing = await getLeaveRequest(id, organizationId)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Leave request not found' })
  }

  const statusChanged = result.data.status !== existing.status
  if (statusChanged) {
    await requireRole(event, ['owner', 'admin'])
  }

  const updated = await updateLeaveRequest(id, result.data, organizationId)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Leave request not found' })
  }

  if (statusChanged && (updated.status === 'approved' || updated.status === 'rejected')) {
    const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
    await logAction(organizationId, user.id, user.name, updated.status === 'approved' ? 'leave.approve' : 'leave.reject', 'leaveRequest', id)
  }

  return updated
})
