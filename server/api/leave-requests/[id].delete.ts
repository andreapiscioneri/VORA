import { deleteLeaveRequest } from '~/server/utils/leave'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteLeaveRequest(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Leave request not found' })
  }

  return { success: true }
})
