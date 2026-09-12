import { addEmployeeDocumentSchema } from '~/shared/validation/employee'
import { addEmployeeDocument } from '~/server/utils/employees'
import { requireOrgId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = addEmployeeDocumentSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await addEmployeeDocument(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  return updated
})
