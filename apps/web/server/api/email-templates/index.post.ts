import { emailTemplateInputSchema } from '~/shared/validation/emailTemplate'
import { createEmailTemplate } from '~/server/utils/emailTemplates'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = emailTemplateInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createEmailTemplate(result.data, await requireOrgId(event))
})
