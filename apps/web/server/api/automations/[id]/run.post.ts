import { z } from 'zod'
import { getAutomation } from '~/server/utils/automations'
import { getContact } from '~/server/utils/contacts'
import { runAutomation } from '~/server/utils/automationEngine'
import { requireOrgId } from '~/server/utils/auth'

const schema = z.object({ contactId: z.string().min(1, 'validation.required') })

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const organizationId = await requireOrgId(event)
  const automation = await getAutomation(id, organizationId)
  if (!automation) {
    throw createError({ statusCode: 404, statusMessage: 'Automation not found' })
  }

  const contact = await getContact(result.data.contactId, organizationId)
  if (!contact) {
    throw createError({ statusCode: 404, statusMessage: 'Contact not found' })
  }

  return await runAutomation(automation, contact, organizationId)
})
