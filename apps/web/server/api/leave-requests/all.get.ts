import { listAllLeaveRequests } from '~/server/utils/leave'
import { requireOrgId } from '~/server/utils/auth'

// The balance widget on the Leave page needs every request for the current
// year to sum used days correctly — the cursor-paginated list (index.get.ts)
// only covers whatever page is currently loaded, which would silently
// under-report used days for any org with more requests than one page.
export default defineEventHandler(async (event) => {
  const organizationId = await requireOrgId(event)
  return await listAllLeaveRequests(organizationId)
})
