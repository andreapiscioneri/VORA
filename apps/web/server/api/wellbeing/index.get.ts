import { listCheckIns } from '~/server/utils/wellbeing'
import { resolveSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
  return await listCheckIns(user.organizationId, user.id)
})
