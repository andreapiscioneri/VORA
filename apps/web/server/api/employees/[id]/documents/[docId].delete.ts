import { removeEmployeeDocument } from '~/server/utils/employees'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const docId = getRouterParam(event, 'docId')!

  const updated = await removeEmployeeDocument(id, docId, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  return updated
})
