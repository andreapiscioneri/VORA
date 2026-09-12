import { leaveRequestInputSchema } from '~/shared/validation/leave'
import { getLeaveRequest, updateLeaveRequest } from '~/server/utils/leave'
import { requireOrgId, resolveSession } from '~/server/utils/auth'
import { resolveManagerUserId } from '~/server/utils/employees'
import { logAction } from '~/server/utils/auditLog'
import { sendPushToUser } from '~/server/services/notifications'

// Editing a still-pending request's own content is open to any member;
// changing its status (approve/reject) is restricted to an owner/admin OR
// the requester's own manager (Employee.managerId, resolved to a user via
// resolveManagerUserId) — the two are the same PUT endpoint (matching the
// existing UI's edit-or-approve flow), so this check only kicks in when the
// status actually changes.
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
    const session = await resolveSession(event)
    if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

    const isOwnerOrAdmin = session.user.role === 'owner' || session.user.role === 'admin'
    const managerUserId = await resolveManagerUserId(existing.employeeId, organizationId)
    const isManager = managerUserId !== null && managerUserId === session.user.id

    if (!isOwnerOrAdmin && !isManager) {
      throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions for this action' })
    }
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

    if (updated.requesterId) {
      const approved = updated.status === 'approved'
      await sendPushToUser(updated.requesterId, 'approvals', {
        title: approved ? 'Richiesta ferie approvata' : 'Richiesta ferie rifiutata',
        body: `${updated.type} · ${updated.startDate} – ${updated.endDate}`,
        data: { type: 'leaveRequest', leaveRequestId: id },
      })
    }
  }

  return updated
})
