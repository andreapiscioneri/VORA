import { describe, expect, it } from 'vitest'
import { leaveRequestInputSchema } from '~/shared/validation/leave'

const base = { requesterName: 'Ada Lovelace', startDate: '2026-08-01', endDate: '2026-08-05' }

describe('leaveRequestInputSchema', () => {
  it('accepts a valid request where endDate is on/after startDate', () => {
    expect(leaveRequestInputSchema.safeParse(base).success).toBe(true)
    expect(
      leaveRequestInputSchema.safeParse({ ...base, startDate: '2026-08-01', endDate: '2026-08-01' }).success,
    ).toBe(true)
  })

  it('rejects an endDate before startDate', () => {
    const result = leaveRequestInputSchema.safeParse({ ...base, startDate: '2026-08-05', endDate: '2026-08-01' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['endDate'])
      expect(result.error.issues[0].message).toBe('validation.endBeforeStart')
    }
  })

  it('rejects a missing requester name', () => {
    expect(leaveRequestInputSchema.safeParse({ ...base, requesterName: '' }).success).toBe(false)
  })

  it('rejects an unknown leave type', () => {
    expect(leaveRequestInputSchema.safeParse({ ...base, type: 'sabbatical-ish' }).success).toBe(false)
  })
})
