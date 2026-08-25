import { deleteCheckIn } from '~/server/utils/wellbeing'
import { resolveSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteCheckIn(id, user.organizationId, user.id)
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Check-in not found' })
  }
  return { success: true }
})
