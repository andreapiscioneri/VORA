import { listAllEvents } from '~/server/utils/events'
import { requireOrgId } from '~/server/utils/auth'

// The calendar page needs the complete event set to expand recurring events
// and render a month grid — cursor pagination (see index.get.ts) is right
// for a scrolling list, but wrong here: a grid/agenda view can't tell which
// page an arbitrary month falls on. Events are naturally bounded per org
// (unlike contacts/tasks), so an unpaginated fetch is the correct shape.
export default defineEventHandler(async (event) => {
  const organizationId = await requireOrgId(event)
  return await listAllEvents(organizationId)
})
