import { getPreferences } from '~/server/utils/notificationPreferences'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return await getPreferences(user.id)
})
