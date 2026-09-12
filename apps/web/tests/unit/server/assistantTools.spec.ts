import { describe, expect, it } from 'vitest'
import { ASSISTANT_TOOLS, getAssistantTool } from '../../../server/services/assistant/tools'

describe('ASSISTANT_TOOLS registry', () => {
  it('only lists tools that are grounded in real Vora capabilities (tasks, calendar, search)', () => {
    const names = ASSISTANT_TOOLS.map((t) => t.name)
    expect(names).toEqual(['search_vora', 'list_tasks', 'create_task', 'list_upcoming_events', 'create_calendar_event'])
  })

  it('marks every read-only tool as not requiring confirmation, and every write tool as requiring it', () => {
    for (const tool of ASSISTANT_TOOLS) {
      const isWrite = tool.name.startsWith('create_')
      expect(tool.requiresConfirmation).toBe(isWrite)
    }
  })

  it('every tool has a non-empty name and description', () => {
    for (const tool of ASSISTANT_TOOLS) {
      expect(tool.name.length).toBeGreaterThan(0)
      expect(tool.description.length).toBeGreaterThan(0)
    }
  })

  it('getAssistantTool finds a tool by name and returns undefined for an unknown one', () => {
    expect(getAssistantTool('search_vora')?.name).toBe('search_vora')
    expect(getAssistantTool('delete_organization')).toBeUndefined()
  })
})

describe('create_task tool input schema', () => {
  const tool = getAssistantTool('create_task')!

  it('accepts a title-only input, filling in optional fields', () => {
    const result = tool.inputSchema.safeParse({ title: 'Chiamare il fornitore' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty title', () => {
    const result = tool.inputSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid priority value the model might hallucinate', () => {
    const result = tool.inputSchema.safeParse({ title: 'Test', priority: 'super-urgent' })
    expect(result.success).toBe(false)
  })
})

describe('create_calendar_event tool input schema', () => {
  const tool = getAssistantTool('create_calendar_event')!

  it('requires title, startAt and endAt', () => {
    expect(tool.inputSchema.safeParse({ title: 'Riunione', startAt: '2026-01-01T10:00:00Z', endAt: '2026-01-01T11:00:00Z' }).success).toBe(true)
    expect(tool.inputSchema.safeParse({ title: 'Riunione' }).success).toBe(false)
  })
})

describe('list_tasks tool input schema', () => {
  const tool = getAssistantTool('list_tasks')!

  it('accepts an empty input (onlyOpen is optional)', () => {
    expect(tool.inputSchema.safeParse({}).success).toBe(true)
  })
})
