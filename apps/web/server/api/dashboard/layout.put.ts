import { z } from 'zod'
import { setLayout } from '~/server/utils/dashboardLayout'
import { resolveSession } from '~/server/utils/auth'

// Kept inline (rather than in shared/validation/, as notificationPreferences
// does) because this endpoint's file is the only server-side file this task
// is scoped to touch outside shared/types/dashboard.ts.
const dashboardWidgetLayoutSchema = z.object({
  key: z.string().min(1),
  visible: z.boolean(),
  size: z.enum(['normal', 'wide']),
})

const dashboardLayoutSchema = z.object({
  widgets: z.array(dashboardWidgetLayoutSchema),
})

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
  const body = await readBody(event)
  const result = dashboardLayoutSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await setLayout(user.id, result.data)
})
