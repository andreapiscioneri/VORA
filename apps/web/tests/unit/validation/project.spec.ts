import { describe, expect, it } from 'vitest'
import { projectInputSchema } from '~/shared/validation/project'

describe('projectInputSchema', () => {
  it('accepts a valid due date on or after the start date', () => {
    expect(projectInputSchema.safeParse({ name: 'Launch', startDate: '2026-01-01', dueDate: '2026-01-31' }).success).toBe(true)
    expect(projectInputSchema.safeParse({ name: 'Launch', startDate: '2026-01-01', dueDate: '2026-01-01' }).success).toBe(true)
  })

  it('rejects a due date before the start date', () => {
    const result = projectInputSchema.safeParse({ name: 'Launch', startDate: '2026-01-31', dueDate: '2026-01-01' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validation.endBeforeStart')
      expect(result.error.issues[0].path).toEqual(['dueDate'])
    }
  })

  it('allows either date to be absent without triggering the range check', () => {
    expect(projectInputSchema.safeParse({ name: 'Launch', startDate: null, dueDate: '2026-01-01' }).success).toBe(true)
    expect(projectInputSchema.safeParse({ name: 'Launch', startDate: '2026-01-01', dueDate: null }).success).toBe(true)
    expect(projectInputSchema.safeParse({ name: 'Launch' }).success).toBe(true)
  })
})
