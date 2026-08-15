import { z } from 'zod'
import { COMMUNICATION_STATUSES } from '~/shared/types/communication'
import { updateCommunication } from '~/server/utils/communications'
import { requireOrgId } from '~/server/utils/auth'

const patchSchema = z.object({
  status: z.enum(COMMUNICATION_STATUSES).optional(),
  labels: z.array(z.string().trim().min(1).max(40)).optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const result = patchSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const updated = await updateCommunication(id, result.data, await requireOrgId(event))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Communication not found' })
  }

  return updated
})
