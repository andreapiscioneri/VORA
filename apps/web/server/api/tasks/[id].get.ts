import { getTask } from '~/server/utils/tasks'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const task = await getTask(id, await requireOrgId(event))

  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  return task
})
