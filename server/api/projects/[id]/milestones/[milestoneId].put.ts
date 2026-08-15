import { toggleProjectMilestone } from '~/server/utils/projects'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const milestoneId = getRouterParam(event, 'milestoneId')!

  const updated = await toggleProjectMilestone(id, milestoneId, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  return updated
})
