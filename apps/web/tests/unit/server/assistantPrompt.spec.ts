import { describe, expect, it } from 'vitest'
import { buildAssistantSystemPrompt } from '../../../server/services/assistant/prompt'
import { ASSISTANT_TOOLS } from '../../../server/services/assistant/tools'

describe('buildAssistantSystemPrompt', () => {
  const ctx = { userName: 'Mario Rossi', organizationName: 'Acme Srl', todayIso: '2026-01-15' }

  it('includes the user name, organization name and today\'s date', () => {
    const prompt = buildAssistantSystemPrompt(ctx)
    expect(prompt).toContain('Mario Rossi')
    expect(prompt).toContain('Acme Srl')
    expect(prompt).toContain('2026-01-15')
  })

  it('lists every registered tool by name so the model knows its real capabilities', () => {
    const prompt = buildAssistantSystemPrompt(ctx)
    for (const tool of ASSISTANT_TOOLS) {
      expect(prompt).toContain(tool.name)
    }
  })

  it('states the payroll/tax hard limit explicitly', () => {
    const prompt = buildAssistantSystemPrompt(ctx)
    expect(prompt.toLowerCase()).toMatch(/irpef|payroll|consulente/)
  })
})
