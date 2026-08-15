import { getSegment, resolveSegment } from '~/server/utils/segments'
import { requireOrgId } from '~/server/utils/auth'

// Resolves a segment's saved filter against the org's real contacts, so the
// campaign flow can use a genuine recipient count/list instead of a
// manually-typed estimate.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const organizationId = await requireOrgId(event)
  const segment = await getSegment(id, organizationId)

  if (!segment) {
    throw createError({ statusCode: 404, statusMessage: 'Segment not found' })
  }

  const contacts = await resolveSegment(segment, organizationId)
  return { contacts, count: contacts.length }
})
