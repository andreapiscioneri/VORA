import { projectInputSchema } from '~/shared/validation/project'
import { updateProject } from '~/server/utils/projects'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = projectInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await updateProject(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  return updated
})
