import { getContact } from '~/server/utils/contacts'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const contact = await getContact(id, await requireOrgId(event))

  if (!contact) {
    throw createError({ statusCode: 404, statusMessage: 'Contact not found' })
  }

  return contact
})
