import { describe, expect, it } from 'vitest'
import { contactInputSchema } from '~/shared/validation/contact'

const base = { firstName: 'Ada', lastName: 'Lovelace' }

describe('contactInputSchema', () => {
  it('accepts a minimal valid contact and fills in defaults', () => {
    const result = contactInputSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('lead')
      expect(result.data.source).toBe('manual')
      expect(result.data.tags).toEqual([])
    }
  })

  it('rejects a missing first or last name', () => {
    expect(contactInputSchema.safeParse({ firstName: '', lastName: 'Lovelace' }).success).toBe(false)
    expect(contactInputSchema.safeParse({ firstName: 'Ada', lastName: '' }).success).toBe(false)
  })

  it('rejects an invalid email but allows an empty one', () => {
    expect(contactInputSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false)
    expect(contactInputSchema.safeParse({ ...base, email: '' }).success).toBe(true)
    expect(contactInputSchema.safeParse({ ...base, email: 'ada@example.com' }).success).toBe(true)
  })

  it('rejects an unknown status enum value', () => {
    expect(contactInputSchema.safeParse({ ...base, status: 'vip' }).success).toBe(false)
  })

  it('rejects a first name over the 80 char limit', () => {
    expect(contactInputSchema.safeParse({ ...base, firstName: 'a'.repeat(81) }).success).toBe(false)
  })
})
