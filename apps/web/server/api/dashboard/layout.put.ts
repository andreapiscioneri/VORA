import { z } from 'zod'
import { setLayout } from '~/server/utils/dashboardLayout'

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
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  const result = dashboardLayoutSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  return await setLayout(user.id, result.data)
})
