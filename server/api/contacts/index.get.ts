import { listContacts } from '~/server/utils/contacts'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listContacts(await requireOrgId(event))
})
