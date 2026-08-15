import { listTasks } from '~/server/utils/tasks'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listTasks(await requireOrgId(event))
})
