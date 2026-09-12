import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import type { AssistantMessage, AssistantToolCall } from '~/shared/types/assistant'
import { ASSISTANT_TOOLS, getAssistantTool, type AssistantToolContext } from './tools'
import { buildAssistantSystemPrompt, type AssistantPromptContext } from './prompt'

// Same conventions as the existing AnthropicAIService (server/services/ai/anthropic.ts):
// a short request timeout (an SSE client is actively waiting), and retries
// only apply before any text has reached the caller.
const MODEL = process.env.AI_MODEL || 'claude-opus-5'
const REQUEST_TIMEOUT_MS = 30_000
const MAX_TOOL_ITERATIONS = 4

export type AssistantStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'tool_result'; toolCall: AssistantToolCall }
  | { type: 'confirm_required'; toolCall: AssistantToolCall }
  | { type: 'done'; message: AssistantMessage }
  | { type: 'error'; message: string }

function getClient(): Anthropic {
  const apiKey = process.env.AI_API_KEY
  if (!apiKey) throw new Error('AI_API_KEY not configured')
  return new Anthropic({ apiKey })
}

function anthropicTools(): Anthropic.Tool[] {
  return ASSISTANT_TOOLS.map((t) => {
    const schema = z.toJSONSchema(t.inputSchema) as Record<string, unknown>
    delete schema.$schema
    return { name: t.name, description: t.description, input_schema: schema as Anthropic.Tool.InputSchema }
  })
}

// A prior turn's tool call is already resolved by the time it's history —
// its outcome is folded into the assistant's own final text — so history
// only ever needs to replay plain text, never tool_use/tool_result blocks.
function historyToMessages(history: AssistantMessage[]): Anthropic.MessageParam[] {
  return history.filter((m) => m.status === 'complete' && m.content).map((m) => ({ role: m.role, content: m.content }))
}

function newToolCall(name: string, input: Record<string, unknown>): AssistantToolCall {
  return { id: randomUUID(), name, input, status: 'pending_confirmation' }
}

interface LoopState {
  ctx: AssistantToolContext
  promptCtx: AssistantPromptContext
  messages: Anthropic.MessageParam[]
  textBuffer: string
  signal?: AbortSignal
}

async function* runLoop(state: LoopState): AsyncGenerator<AssistantStreamEvent> {
  const client = getClient()
  const system = buildAssistantSystemPrompt(state.promptCtx)

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const stream = client.messages.stream(
      { model: MODEL, max_tokens: 1536, system, messages: state.messages, tools: anthropicTools() },
      { timeout: REQUEST_TIMEOUT_MS, signal: state.signal },
    )

    try {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          state.textBuffer += event.delta.text
          yield { type: 'delta', text: event.delta.text }
        }
      }
    } catch (error) {
      if (state.signal?.aborted) return
      throw error
    }

    const final = await stream.finalMessage()
    const toolUseBlocks = final.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')

    if (toolUseBlocks.length === 0 || final.stop_reason !== 'tool_use') {
      yield {
        type: 'done',
        message: { id: randomUUID(), role: 'assistant', content: state.textBuffer, createdAt: new Date().toISOString(), status: 'complete' },
      }
      return
    }

    // Assistant's turn (text-so-far + every tool_use block it asked for)
    // must be appended before any tool_result, or the next request is
    // rejected by the API as malformed.
    state.messages.push({ role: 'assistant', content: final.content })

    const toolResultBlocks: Anthropic.ToolResultBlockParam[] = []

    for (const block of toolUseBlocks) {
      const tool = getAssistantTool(block.name)
      if (!tool) {
        toolResultBlocks.push({ type: 'tool_result', tool_use_id: block.id, is_error: true, content: `Unknown tool: ${block.name}` })
        continue
      }

      const parsedInput = tool.inputSchema.safeParse(block.input)
      if (!parsedInput.success) {
        toolResultBlocks.push({ type: 'tool_result', tool_use_id: block.id, is_error: true, content: 'Invalid tool input' })
        continue
      }

      if (tool.requiresConfirmation) {
        const toolCall: AssistantToolCall = { id: block.id, name: block.name, input: parsedInput.data, status: 'pending_confirmation' }
        yield { type: 'confirm_required', toolCall }
        yield {
          type: 'done',
          message: {
            id: randomUUID(),
            role: 'assistant',
            content: state.textBuffer,
            createdAt: new Date().toISOString(),
            status: 'complete',
            toolCalls: [toolCall],
          },
        }
        return
      }

      try {
        const result = await tool.handler(parsedInput.data, state.ctx)
        const toolCall: AssistantToolCall = { id: block.id, name: block.name, input: parsedInput.data, status: 'executed', result }
        yield { type: 'tool_result', toolCall }
        toolResultBlocks.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tool execution failed'
        yield { type: 'tool_result', toolCall: { id: block.id, name: block.name, input: parsedInput.data, status: 'error', error: message } }
        toolResultBlocks.push({ type: 'tool_result', tool_use_id: block.id, is_error: true, content: message })
      }
    }

    state.messages.push({ role: 'user', content: toolResultBlocks })
  }

  // Hit MAX_TOOL_ITERATIONS without a final answer — stop rather than loop
  // forever; whatever text has streamed so far is still saved.
  yield {
    type: 'done',
    message: { id: randomUUID(), role: 'assistant', content: state.textBuffer, createdAt: new Date().toISOString(), status: 'complete' },
  }
}

export async function* runAssistantTurn(opts: {
  ctx: AssistantToolContext
  promptCtx: AssistantPromptContext
  history: AssistantMessage[]
  userMessageText: string
  signal?: AbortSignal
}): AsyncGenerator<AssistantStreamEvent> {
  try {
    const messages = [...historyToMessages(opts.history), { role: 'user' as const, content: opts.userMessageText }]
    yield* runLoop({ ctx: opts.ctx, promptCtx: opts.promptCtx, messages, textBuffer: '', signal: opts.signal })
  } catch (error) {
    yield { type: 'error', message: error instanceof Error ? error.message : 'Assistant request failed' }
  }
}

// Resumes a paused turn after the user approves/rejects a pending tool
// call — `history` must NOT include the pending message itself (the caller
// passes every message up to but excluding it).
export async function* resumeAssistantTurn(opts: {
  ctx: AssistantToolContext
  promptCtx: AssistantPromptContext
  history: AssistantMessage[]
  pendingText: string
  pendingToolCall: AssistantToolCall
  approve: boolean
  signal?: AbortSignal
}): AsyncGenerator<AssistantStreamEvent> {
  try {
    const messages: Anthropic.MessageParam[] = [...historyToMessages(opts.history)]
    const assistantContent: Anthropic.ContentBlockParam[] = []
    if (opts.pendingText) assistantContent.push({ type: 'text', text: opts.pendingText })
    assistantContent.push({ type: 'tool_use', id: opts.pendingToolCall.id, name: opts.pendingToolCall.name, input: opts.pendingToolCall.input })
    messages.push({ role: 'assistant', content: assistantContent })

    if (!opts.approve) {
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: opts.pendingToolCall.id, content: "L'utente ha annullato questa azione." }],
      })
      yield {
        type: 'tool_result',
        toolCall: { ...opts.pendingToolCall, status: 'rejected' },
      }
    } else {
      const tool = getAssistantTool(opts.pendingToolCall.name)
      if (!tool) throw new Error(`Unknown tool: ${opts.pendingToolCall.name}`)
      try {
        const result = await tool.handler(opts.pendingToolCall.input, opts.ctx)
        messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: opts.pendingToolCall.id, content: JSON.stringify(result) }] })
        yield { type: 'tool_result', toolCall: { ...opts.pendingToolCall, status: 'executed', result } }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tool execution failed'
        messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: opts.pendingToolCall.id, is_error: true, content: message }] })
        yield { type: 'tool_result', toolCall: { ...opts.pendingToolCall, status: 'error', error: message } }
      }
    }

    yield* runLoop({ ctx: opts.ctx, promptCtx: opts.promptCtx, messages, textBuffer: '', signal: opts.signal })
  } catch (error) {
    yield { type: 'error', message: error instanceof Error ? error.message : 'Assistant request failed' }
  }
}
