import { deleteCheckIn } from '~/server/utils/wellbeing'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteCheckIn(id, user.organizationId, user.id)
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Check-in not found' })
  }
  return { success: true }
})
