import { listAppNotifications } from '~/server/utils/appNotifications'
import { resolveSession } from '~/server/utils/auth'
import { parsePaginationParams } from '~/server/utils/pagination'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { cursor, pageSize } = parsePaginationParams(event)
  return await listAppNotifications(session.user.id, { cursor, pageSize })
})
