import { taskInputSchema } from '~/shared/validation/task'
import { createTask } from '~/server/utils/tasks'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = taskInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createTask(result.data, await requireOrgId(event))
})
