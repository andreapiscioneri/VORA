import { listTasks } from '~/server/utils/tasks'
import { requireOrgId } from '~/server/utils/auth'
import { parsePaginationParams } from '~/server/utils/pagination'

export default defineEventHandler(async (event) => {
  const organizationId = await requireOrgId(event)
  const { cursor, pageSize } = parsePaginationParams(event)
  return await listTasks(organizationId, { cursor, pageSize })
})
