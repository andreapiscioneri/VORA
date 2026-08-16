import { describe, expect, it } from 'vitest'
import { taskInputSchema } from '~/shared/validation/task'

describe('taskInputSchema', () => {
  it('accepts a minimal valid task and fills in defaults', () => {
    const result = taskInputSchema.safeParse({ title: 'Write the report' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe('medium')
      expect(result.data.status).toBe('todo')
      expect(result.data.checklist).toEqual([])
    }
  })

  it('rejects an empty title', () => {
    expect(taskInputSchema.safeParse({ title: '' }).success).toBe(false)
  })

  it('rejects a title over 160 chars', () => {
    expect(taskInputSchema.safeParse({ title: 'a'.repeat(161) }).success).toBe(false)
  })

  it('rejects an unknown priority or status', () => {
    expect(taskInputSchema.safeParse({ title: 'x', priority: 'urgentish' }).success).toBe(false)
    expect(taskInputSchema.safeParse({ title: 'x', status: 'done-ish' }).success).toBe(false)
  })

  it('validates checklist items', () => {
    const result = taskInputSchema.safeParse({
      title: 'x',
      checklist: [{ id: '1', label: 'Step one' }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.checklist[0].done).toBe(false)
    }
    expect(taskInputSchema.safeParse({ title: 'x', checklist: [{ id: '1', label: '' }] }).success).toBe(false)
  })
})
