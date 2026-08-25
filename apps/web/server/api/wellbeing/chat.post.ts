import { createEventStream } from 'h3'
import { wellbeingChatMessageInputSchema } from '~/shared/validation/wellbeing'
import { getAIService } from '~/server/services/ai'
import { appendMessage, listMessages } from '~/server/utils/wellbeingChat'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { resolveSession } from '~/server/utils/auth'
import { logger } from '~/server/utils/logger'

// Server-Sent Events response: each token from AIService.wellbeingChat()
// (real streaming on AnthropicAIService, a single chunk on the heuristic
// fallback — see server/services/ai/types.ts) is pushed as an SSE "delta"
// event; a final "done" event signals completion so the client knows when
// to stop appending. Real per-request auth (not just a session cookie) is
// still enforced by resolveSession below — SSE doesn't change that.
export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
  checkRateLimit(event, 'wellbeing:chat', { max: 20, windowMs: 10 * 60 * 1000 })

  const body = await readBody(event)
  const result = wellbeingChatMessageInputSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const history = await listMessages(user.organizationId, user.id)
  await appendMessage(user.organizationId, user.id, 'user', result.data.content)

  const eventStream = createEventStream(event)
  let fullResponse = ''

  ;(async () => {
    try {
      for await (const delta of getAIService().wellbeingChat(
        history.map((m) => ({ role: m.role, content: m.content })),
        result.data.content
      )) {
        fullResponse += delta
        await eventStream.push({ event: 'delta', data: delta })
      }
    } catch (error) {
      logger.error('wellbeing chat stream failed', { organizationId: user.organizationId, userId: user.id }, error)
      await eventStream.push({
        event: 'error',
        data: 'Non sono riuscito a rispondere. Riprova tra poco.',
      })
    } finally {
      if (fullResponse) {
        await appendMessage(user.organizationId, user.id, 'assistant', fullResponse)
      }
      await eventStream.push({ event: 'done', data: '' })
      await eventStream.close()
    }
  })()

  return eventStream.send()
})
