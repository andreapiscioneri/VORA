import { describe, expect, it } from 'vitest'
import { assistantToolConfirmSchema, renameAssistantConversationSchema, sendAssistantMessageSchema } from '~/shared/validation/assistant'

describe('sendAssistantMessageSchema', () => {
  it('rejects an empty message', () => {
    expect(sendAssistantMessageSchema.safeParse({ content: '   ' }).success).toBe(false)
  })

  it('trims and accepts a normal message', () => {
    const result = sendAssistantMessageSchema.safeParse({ content: '  Ciao!  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.content).toBe('Ciao!')
  })

  it('rejects a message over the max length', () => {
    expect(sendAssistantMessageSchema.safeParse({ content: 'a'.repeat(4001) }).success).toBe(false)
  })
})

describe('renameAssistantConversationSchema', () => {
  it('rejects an empty title', () => {
    expect(renameAssistantConversationSchema.safeParse({ title: '' }).success).toBe(false)
  })

  it('accepts a normal title', () => {
    expect(renameAssistantConversationSchema.safeParse({ title: 'Pianificazione sprint' }).success).toBe(true)
  })
})

describe('assistantToolConfirmSchema', () => {
  it('requires both toolCallId and approve', () => {
    expect(assistantToolConfirmSchema.safeParse({ toolCallId: 'abc' }).success).toBe(false)
    expect(assistantToolConfirmSchema.safeParse({ approve: true }).success).toBe(false)
    expect(assistantToolConfirmSchema.safeParse({ toolCallId: 'abc', approve: true }).success).toBe(true)
    expect(assistantToolConfirmSchema.safeParse({ toolCallId: 'abc', approve: false }).success).toBe(true)
  })
})
