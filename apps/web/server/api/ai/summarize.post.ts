import { z } from 'zod'
import { getAIService } from '~/server/services/ai'
import { requireOrgId } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/utils/rateLimit'

const schema = z.object({ text: z.string().trim().min(1, 'validation.required').max(8000) })

export default defineEventHandler(async (event) => {
  await requireOrgId(event)
  checkRateLimit(event, 'ai:summarize', { max: 20, windowMs: 10 * 60 * 1000 })

  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const summary = await getAIService().summarize(result.data.text)
  return { ...summary, provider: getAIService().name }
})
