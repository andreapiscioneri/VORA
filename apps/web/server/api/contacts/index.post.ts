import { contactInputSchema } from '~/shared/validation/contact'
import { createContact } from '~/server/utils/contacts'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = contactInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await createContact(result.data, await requireOrgId(event))
})
