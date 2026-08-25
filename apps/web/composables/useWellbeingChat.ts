import type { WellbeingChatMessage } from '~/shared/types/wellbeing'

// Parses one Server-Sent Events buffer chunk into {event, data} pairs. SSE
// frames are separated by a blank line; a frame may carry multiple `data:`
// lines (spec allows this for multi-line payloads), joined with `\n`.
function parseSseFrame(frame: string): { event: string; data: string } {
  let eventName = 'message'
  const dataLines: string[] = []
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice('event:'.length).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice('data:'.length).replace(/^ /, ''))
  }
  return { event: eventName, data: dataLines.join('\n') }
}

export function useWellbeingChat() {
  const messages = useState<WellbeingChatMessage[]>('wellbeing-chat-messages', () => [])
  const pending = useState('wellbeing-chat-pending', () => false)
  const streaming = useState('wellbeing-chat-streaming', () => false)
  const error = useState<string | null>('wellbeing-chat-error', () => null)

  async function fetchHistory() {
    pending.value = true
    error.value = null
    try {
      messages.value = await $fetch<WellbeingChatMessage[]>('/api/wellbeing/chat')
    } catch {
      error.value = 'wellbeing.chat.errors.load'
    } finally {
      pending.value = false
    }
  }

  // Not $fetch: this reads a real streaming Server-Sent Events response
  // (server/api/wellbeing/chat.post.ts) token-by-token, which $fetch's
  // buffered-body model doesn't expose. credentials default to
  // 'same-origin', which already carries the Nuxt session cookie.
  async function sendMessage(content: string) {
    error.value = null
    streaming.value = true

    const userMessage: WellbeingChatMessage = {
      id: `local-${Date.now()}`,
      userId: '',
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    messages.value = [...messages.value, userMessage]

    const assistantMessage: WellbeingChatMessage = {
      id: `local-${Date.now()}-assistant`,
      userId: '',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }
    messages.value = [...messages.value, assistantMessage]

    try {
      const response = await fetch('/api/wellbeing/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

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
            messages.value = [...messages.value]
          } else if (event === 'error') {
            error.value = data
          }
          // 'done' needs no handling — the loop exits when the stream closes.
        }
      }
    } catch {
      error.value = 'wellbeing.chat.errors.send'
    } finally {
      streaming.value = false
    }
  }

  return { messages, pending, streaming, error, fetchHistory, sendMessage }
}
