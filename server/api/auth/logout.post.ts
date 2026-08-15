import { logAction } from '~/server/utils/auditLog'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (session.user) {
    await logAction(session.user.organizationId, session.user.id, session.user.name, 'logout', 'session')
  }
  await clearUserSession(event)
  return { success: true }
})
