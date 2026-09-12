import { createEventStream } from 'h3'
import { assistantToolConfirmSchema } from '~/shared/validation/assistant'
import { resolveSession } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { getConversation, appendMessages, replaceMessage } from '~/server/utils/assistantConversations'
import { resumeAssistantTurn } from '~/server/services/assistant/agent'
import { logger } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  checkRateLimit(event, 'ai:assistant:tool-confirm', { max: 30, windowMs: 10 * 60 * 1000 })

  const id = getRouterParam(event, 'id')!
  const { organizationId, id: userId, name: userName, organizationName } = session.user

  const conversation = await getConversation(id, organizationId, userId)
  if (!conversation) throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })

  const body = await readBody(event)
  const result = assistantToolConfirmSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const pendingMessage = conversation.messages.find((m) => m.toolCalls?.some((tc) => tc.id === result.data.toolCallId && tc.status === 'pending_confirmation'))
  const pendingToolCall = pendingMessage?.toolCalls?.find((tc) => tc.id === result.data.toolCallId)
  if (!pendingMessage || !pendingToolCall) {
    throw createError({ statusCode: 404, statusMessage: 'No pending tool call with that id' })
  }

  const historyBeforePending = conversation.messages.slice(0, conversation.messages.indexOf(pendingMessage))

  const eventStream = createEventStream(event)
  const controller = new AbortController()
  eventStream.onClosed(() => controller.abort())

  ;(async () => {
    try {
      for await (const streamEvent of resumeAssistantTurn({
        ctx: { organizationId, userId },
        promptCtx: { userName, organizationName, todayIso: new Date().toISOString().slice(0, 10) },
        history: historyBeforePending,
        pendingText: pendingMessage.content,
        pendingToolCall,
        approve: result.data.approve,
        signal: controller.signal,
      })) {
        if (streamEvent.type === 'delta') {
          await eventStream.push({ event: 'delta', data: streamEvent.text })
        } else if (streamEvent.type === 'tool_result') {
          await replaceMessage(id, organizationId, userId, { ...pendingMessage, toolCalls: [streamEvent.toolCall] })
          await eventStream.push({ event: 'tool_result', data: JSON.stringify(streamEvent.toolCall) })
        } else if (streamEvent.type === 'confirm_required') {
          await eventStream.push({ event: 'confirm_required', data: JSON.stringify(streamEvent.toolCall) })
        } else if (streamEvent.type === 'done') {
          await appendMessages(id, organizationId, userId, [streamEvent.message])
          await eventStream.push({ event: 'done', data: JSON.stringify(streamEvent.message) })
        } else if (streamEvent.type === 'error') {
          logger.error('assistant tool-confirm stream failed', { organizationId, userId, conversationId: id }, streamEvent.message)
          await eventStream.push({ event: 'error', data: streamEvent.message })
        }
      }
    } catch (error) {
      logger.error('assistant tool-confirm stream crashed', { organizationId, userId, conversationId: id }, error)
      await eventStream.push({ event: 'error', data: 'unexpected_error' })
    } finally {
      await eventStream.close()
    }
  })()

  return eventStream.send()
})
