import { listEntries } from '~/server/utils/timesheets'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  return await listEntries(await requireOrgId(event))
})
