import { listEmailTemplates } from '~/server/utils/emailTemplates'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listEmailTemplates(await requireOrgId(event))
})
