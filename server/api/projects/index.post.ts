import { projectInputSchema } from '~/shared/validation/project'
import { createProject } from '~/server/utils/projects'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = projectInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createProject(result.data, await requireOrgId(event))
})
