import { getProject } from '~/server/utils/projects'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const project = await getProject(id, await requireOrgId(event))

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  return project
})
