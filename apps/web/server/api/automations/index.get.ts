import { listAutomations } from '~/server/utils/automations'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listAutomations(await requireOrgId(event))
})
