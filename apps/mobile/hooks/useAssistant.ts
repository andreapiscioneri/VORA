import { useCallback, useRef, useState } from 'react'
import { fetch as expoFetch } from 'expo/fetch'
import { api, API_BASE, getStoredAccessToken } from '../lib/api'
import type { AssistantConversation, AssistantConversationSummary, AssistantMessage, AssistantToolCall } from '@vora/shared/types/assistant'

// Same SSE frame parser as the web composable (apps/web/composables/useAssistant.ts) —
// duplicated because web and mobile don't share a runtime module, only types.
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
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [activeConversation, setActiveConversation] = useState<AssistantConversation | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [pendingToolCall, setPendingToolCall] = useState<AssistantToolCall | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // Same reasoning as the web composable: a reload after rename/archive/
  // delete needs to know which tab/filter is currently visible, not just
  // "the default recent list".
  const filterRef = useRef<{ archived: boolean; query: string }>({ archived: false, query: '' })

  const loadConversations = useCallback(async (opts?: { archived?: boolean; query?: string }) => {
    if (opts) filterRef.current = { archived: opts.archived ?? false, query: opts.query ?? '' }
    setConversationsLoading(true)
    try {
      const { archived, query } = filterRef.current
      const params = new URLSearchParams()
      if (archived) params.set('archived', 'true')
      if (query) params.set('q', query)
      const qs = params.toString()
      const list = await api.get<AssistantConversationSummary[]>(`/ai/assistant/conversations${qs ? `?${qs}` : ''}`)
      setConversations(list)
    } catch {
      setError('assistant.errors.load')
    } finally {
      setConversationsLoading(false)
    }
  }, [])

  const openConversation = useCallback(async (id: string) => {
    setError(null)
    const conversation = await api.get<AssistantConversation>(`/ai/assistant/conversations/${id}`)
    setActiveConversation(conversation)
    setPendingToolCall(conversation.messages.flatMap((m) => m.toolCalls ?? []).find((tc) => tc.status === 'pending_confirmation') ?? null)
  }, [])

  const startNewConversation = useCallback(
    async (defaultTitle: string) => {
      const conversation = await api.post<AssistantConversation>('/ai/assistant/conversations', { title: defaultTitle })
      setActiveConversation(conversation)
      setPendingToolCall(null)
      await loadConversations()
      return conversation
    },
    [loadConversations],
  )

  const upsertMessage = useCallback((message: AssistantMessage) => {
    setActiveConversation((prev) => {
      if (!prev) return prev
      const idx = prev.messages.findIndex((m) => m.id === message.id)
      const messages = idx === -1 ? [...prev.messages, message] : prev.messages.map((m, i) => (i === idx ? message : m))
      return { ...prev, messages }
    })
  }, [])

  const consumeStream = useCallback(
    async (path: string, body: unknown) => {
      setError(null)
      setStreaming(true)
      setPendingToolCall(null)

      const controller = new AbortController()
      abortRef.current = controller

      let assistantMessage: AssistantMessage = {
        id: `pending-${Date.now()}`,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'complete',
      }
      upsertMessage(assistantMessage)

      try {
        const token = await getStoredAccessToken()
        const response = await expoFetch(`${API_BASE}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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
              assistantMessage = { ...assistantMessage, content: assistantMessage.content + data }
              upsertMessage(assistantMessage)
            } else if (event === 'tool_result') {
              const toolCall = JSON.parse(data) as AssistantToolCall
              assistantMessage = { ...assistantMessage, toolCalls: [toolCall] }
              upsertMessage(assistantMessage)
            } else if (event === 'confirm_required') {
              setPendingToolCall(JSON.parse(data) as AssistantToolCall)
            } else if (event === 'done') {
              const finalMessage = JSON.parse(data) as AssistantMessage
              upsertMessage({ ...finalMessage, id: assistantMessage.id })
            } else if (event === 'error') {
              setError(data === 'AI_API_KEY not configured' ? 'assistant.notConfigured' : 'assistant.errors.send')
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') setError('assistant.errors.send')
      } finally {
        setStreaming(false)
        abortRef.current = null
        await loadConversations()
      }
    },
    [loadConversations, upsertMessage],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeConversation) return
      const userMessage: AssistantMessage = { id: `local-${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString(), status: 'complete' }
      setActiveConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, userMessage] } : prev))
      await consumeStream(`/ai/assistant/conversations/${activeConversation.id}/messages`, { content })
    },
    [activeConversation, consumeStream],
  )

  const confirmToolCall = useCallback(
    async (approve: boolean) => {
      if (!activeConversation || !pendingToolCall) return
      await consumeStream(`/ai/assistant/conversations/${activeConversation.id}/tool-confirm`, { toolCallId: pendingToolCall.id, approve })
    },
    [activeConversation, pendingToolCall, consumeStream],
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      const updated = await api.patch<AssistantConversation>(`/ai/assistant/conversations/${id}`, { title })
      setActiveConversation((prev) => (prev?.id === id ? updated : prev))
      await loadConversations()
    },
    [loadConversations],
  )

  const setArchived = useCallback(
    async (id: string, archived: boolean) => {
      await api.patch(`/ai/assistant/conversations/${id}`, { archived })
      setActiveConversation((prev) => (prev?.id === id && archived ? null : prev))
      await loadConversations()
    },
    [loadConversations],
  )

  const removeConversation = useCallback(
    async (id: string) => {
      await api.delete(`/ai/assistant/conversations/${id}`)
      setActiveConversation((prev) => (prev?.id === id ? null : prev))
      await loadConversations()
    },
    [loadConversations],
  )

  return {
    conversations,
    conversationsLoading,
    activeConversation,
    streaming,
    pendingToolCall,
    error,
    setError,
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
