import type { AssistantConversation, AssistantConversationSummary, AssistantMessage, AssistantToolCall } from '~/shared/types/assistant'

// Same SSE frame parser as useWellbeingChat.ts (server/api/wellbeing/chat.post.ts) —
// duplicated rather than shared because the two chats consume different
// event names and there's no third caller yet to justify an extraction.
function parseSseFrame(frame: string): { event: string; data: string } {
  let eventName = 'message'
  const dataLines: string[] = []
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice('event:'.length).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice('data:'.length).replace(/^ /, ''))
  }
  return { event: eventName, data: dataLines.join('\n') }
}

export function useAssistant() {
  const { $apiFetch } = useNuxtApp()
  const conversations = useState<AssistantConversationSummary[]>('assistant-conversations', () => [])
  const conversationsLoading = useState('assistant-conversations-loading', () => false)
  const activeConversation = useState<AssistantConversation | null>('assistant-active-conversation', () => null)
  const streaming = useState('assistant-streaming', () => false)
  const pendingToolCall = useState<AssistantToolCall | null>('assistant-pending-tool-call', () => null)
  const error = useState<string | null>('assistant-error', () => null)
  const abortController = useState<AbortController | null>('assistant-abort-controller', () => null)
  // Remembers the last list filter so a reload after rename/archive/delete
  // (which doesn't know or care which tab the user is on) can refresh the
  // list the user is actually looking at, instead of silently jumping them
  // to the "recent" tab's contents.
  const currentFilter = useState<{ archived: boolean; query: string }>('assistant-current-filter', () => ({ archived: false, query: '' }))

  async function loadConversations(opts?: { archived?: boolean; query?: string }) {
    if (opts) currentFilter.value = { archived: opts.archived ?? false, query: opts.query ?? '' }
    conversationsLoading.value = true
    try {
      conversations.value = await $apiFetch<AssistantConversationSummary[]>('/api/ai/assistant/conversations', {
        query: { archived: currentFilter.value.archived ? 'true' : undefined, q: currentFilter.value.query || undefined },
      })
    } catch {
      error.value = 'assistant.errors.load'
    } finally {
      conversationsLoading.value = false
    }
  }

  async function openConversation(id: string) {
    error.value = null
    activeConversation.value = await $apiFetch<AssistantConversation>(`/api/ai/assistant/conversations/${id}`)
    pendingToolCall.value = activeConversation.value.messages
      .flatMap((m) => m.toolCalls ?? [])
      .find((tc) => tc.status === 'pending_confirmation') ?? null
  }

  async function startNewConversation(defaultTitle: string) {
    const conversation = await $apiFetch<AssistantConversation>('/api/ai/assistant/conversations', {
      method: 'POST',
      body: { title: defaultTitle },
    })
    activeConversation.value = conversation
    pendingToolCall.value = null
    await loadConversations()
    return conversation
  }

  function upsertLocalMessage(message: AssistantMessage) {
    if (!activeConversation.value) return
    const idx = activeConversation.value.messages.findIndex((m) => m.id === message.id)
    if (idx === -1) activeConversation.value.messages.push(message)
    else activeConversation.value.messages[idx] = message
  }

  async function consumeStream(url: string, body: unknown) {
    error.value = null
    streaming.value = true
    pendingToolCall.value = null

    const controller = new AbortController()
    abortController.value = controller

    const assistantMessage: AssistantMessage = {
      id: `pending-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      status: 'complete',
    }
    upsertLocalMessage(assistantMessage)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let separatorIndex: number
        while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, separatorIndex)
          buffer = buffer.slice(separatorIndex + 2)
          const { event, data } = parseSseFrame(frame)

          if (event === 'delta') {
            assistantMessage.content += data
            upsertLocalMessage(assistantMessage)
          } else if (event === 'tool_result') {
            const toolCall = JSON.parse(data) as AssistantToolCall
            assistantMessage.toolCalls = [toolCall]
            upsertLocalMessage(assistantMessage)
          } else if (event === 'confirm_required') {
            pendingToolCall.value = JSON.parse(data) as AssistantToolCall
          } else if (event === 'done') {
            const finalMessage = JSON.parse(data) as AssistantMessage
            upsertLocalMessage({ ...finalMessage, id: assistantMessage.id })
          } else if (event === 'error') {
            error.value = data === 'AI_API_KEY not configured' ? 'assistant.notConfigured' : 'assistant.errors.send'
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') error.value = 'assistant.errors.send'
    } finally {
      streaming.value = false
      abortController.value = null
      await loadConversations()
    }
  }

  async function sendMessage(content: string) {
    if (!activeConversation.value) return
    const userMessage: AssistantMessage = { id: `local-${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString(), status: 'complete' }
    activeConversation.value.messages.push(userMessage)
    await consumeStream(`/api/ai/assistant/conversations/${activeConversation.value.id}/messages`, { content })
  }

  async function confirmToolCall(approve: boolean) {
    if (!activeConversation.value || !pendingToolCall.value) return
    const toolCallId = pendingToolCall.value.id
    await consumeStream(`/api/ai/assistant/conversations/${activeConversation.value.id}/tool-confirm`, { toolCallId, approve })
  }

  function stopStreaming() {
    abortController.value?.abort()
  }

  async function renameConversation(id: string, title: string) {
    const updated = await $apiFetch<AssistantConversation>(`/api/ai/assistant/conversations/${id}`, { method: 'PATCH', body: { title } })
    if (activeConversation.value?.id === id) activeConversation.value = updated
    await loadConversations()
  }

  async function setArchived(id: string, archived: boolean) {
    await $apiFetch(`/api/ai/assistant/conversations/${id}`, { method: 'PATCH', body: { archived } })
    if (activeConversation.value?.id === id && archived) activeConversation.value = null
    await loadConversations()
  }

  async function removeConversation(id: string) {
    await $apiFetch(`/api/ai/assistant/conversations/${id}`, { method: 'DELETE' })
    if (activeConversation.value?.id === id) activeConversation.value = null
    await loadConversations()
  }

  return {
    conversations,
    conversationsLoading,
    activeConversation,
    streaming,
    pendingToolCall,
    error,
    loadConversations,
    openConversation,
    startNewConversation,
    sendMessage,
    confirmToolCall,
    stopStreaming,
    renameConversation,
    setArchived,
    removeConversation,
  }
}
