import { listCheckIns } from '~/server/utils/wellbeing'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return await listCheckIns(user.organizationId, user.id)
})
