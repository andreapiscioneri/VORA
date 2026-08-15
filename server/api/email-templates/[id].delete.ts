import { deleteEmailTemplate } from '~/server/utils/emailTemplates'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteEmailTemplate(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Template not found' })
  }

  return { success: true }
})
