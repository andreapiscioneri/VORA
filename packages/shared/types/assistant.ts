export type AssistantMessageRole = 'user' | 'assistant'

export type AssistantToolCallStatus = 'pending_confirmation' | 'executed' | 'rejected' | 'error'

export interface AssistantToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  status: AssistantToolCallStatus
  result?: unknown
  error?: string
}

export interface AssistantMessage {
  id: string
  role: AssistantMessageRole
  content: string
  createdAt: string
  status: 'complete' | 'error'
  toolCalls?: AssistantToolCall[]
}

export interface AssistantConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  messages: AssistantMessage[]
}

// The conversation list never needs the full message array — this shape
// keeps the list endpoint lightweight regardless of how long a
// conversation gets.
export interface AssistantConversationSummary {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  messageCount: number
  preview: string
}
