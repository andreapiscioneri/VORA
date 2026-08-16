import { emailTemplateInputSchema } from '~/shared/validation/emailTemplate'
import { updateEmailTemplate } from '~/server/utils/emailTemplates'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = emailTemplateInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await updateEmailTemplate(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Template not found' })
  }

  return updated
})
