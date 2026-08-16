import { listLeaveRequests } from '~/server/utils/leave'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listLeaveRequests(await requireOrgId(event))
})
