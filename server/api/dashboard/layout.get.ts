import { getLayout } from '~/server/utils/dashboardLayout'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return await getLayout(user.id)
})
