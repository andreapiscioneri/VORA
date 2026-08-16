import { deleteContact } from '~/server/utils/contacts'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const deleted = await deleteContact(id, await requireOrgId(event))

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Contact not found' })
  }

  return { success: true }
})
