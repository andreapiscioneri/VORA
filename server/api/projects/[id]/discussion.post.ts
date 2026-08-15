import { addProjectCommentSchema } from '~/shared/validation/project'
import { addProjectComment } from '~/server/utils/projects'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = addProjectCommentSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const { user } = await requireUserSession(event)
  const updated = await addProjectComment(id, result.data, user.name, user.organizationId)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  return updated
})
