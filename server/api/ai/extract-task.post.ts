import { z } from 'zod'
import { getAIService } from '~/server/services/ai'

const schema = z.object({ text: z.string().trim().min(1, 'validation.required').max(8000) })

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const suggestion = await getAIService().extractTaskSuggestion(result.data.text)
  return { suggestion, provider: getAIService().name }
})
