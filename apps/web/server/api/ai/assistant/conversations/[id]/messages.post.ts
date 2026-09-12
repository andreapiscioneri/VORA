import { randomUUID } from 'node:crypto'
import { createEventStream } from 'h3'
import { sendAssistantMessageSchema } from '~/shared/validation/assistant'
import type { AssistantMessage } from '~/shared/types/assistant'
import { resolveSession } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { getConversation, appendMessages } from '~/server/utils/assistantConversations'
import { runAssistantTurn } from '~/server/services/assistant/agent'
import { deriveTitle } from '~/server/services/assistant/title'
import { logger } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  checkRateLimit(event, 'ai:assistant:message', { max: 30, windowMs: 10 * 60 * 1000 })

  const id = getRouterParam(event, 'id')!
  const { organizationId, id: userId, name: userName, organizationName } = session.user

  const conversation = await getConversation(id, organizationId, userId)
  if (!conversation) throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })

  const body = await readBody(event)
  const result = sendAssistantMessageSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const userMessage: AssistantMessage = {
    id: randomUUID(),
    role: 'user',
    content: result.data.content,
    createdAt: new Date().toISOString(),
    status: 'complete',
  }

  const isFirstMessage = conversation.messages.length === 0
  await appendMessages(id, organizationId, userId, [userMessage], isFirstMessage ? { title: deriveTitle(result.data.content) } : undefined)

  const eventStream = createEventStream(event)
  const controller = new AbortController()
  eventStream.onClosed(() => controller.abort())

  ;(async () => {
    try {
      for await (const streamEvent of runAssistantTurn({
        ctx: { organizationId, userId },
        promptCtx: { userName, organizationName, todayIso: new Date().toISOString().slice(0, 10) },
        history: conversation.messages,
        userMessageText: result.data.content,
        signal: controller.signal,
      })) {
        if (streamEvent.type === 'delta') {
          await eventStream.push({ event: 'delta', data: streamEvent.text })
        } else if (streamEvent.type === 'tool_result') {
          await eventStream.push({ event: 'tool_result', data: JSON.stringify(streamEvent.toolCall) })
        } else if (streamEvent.type === 'confirm_required') {
          await eventStream.push({ event: 'confirm_required', data: JSON.stringify(streamEvent.toolCall) })
        } else if (streamEvent.type === 'done') {
          await appendMessages(id, organizationId, userId, [streamEvent.message])
          await eventStream.push({ event: 'done', data: JSON.stringify(streamEvent.message) })
        } else if (streamEvent.type === 'error') {
          logger.error('assistant stream failed', { organizationId, userId, conversationId: id }, streamEvent.message)
          await eventStream.push({ event: 'error', data: streamEvent.message })
        }
      }
    } catch (error) {
      logger.error('assistant stream crashed', { organizationId, userId, conversationId: id }, error)
      await eventStream.push({ event: 'error', data: 'unexpected_error' })
    } finally {
      await eventStream.close()
    }
  })()

  return eventStream.send()
})
