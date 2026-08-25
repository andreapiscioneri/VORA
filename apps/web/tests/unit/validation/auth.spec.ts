import { describe, expect, it } from 'vitest'
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '~/shared/validation/auth'

describe('registerSchema', () => {
  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'Password123!',
      organizationName: 'Analytical Engines Inc',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'short',
      organizationName: 'Org',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('auth.passwordTooShort')
    }
  })

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Ada',
      email: 'not-an-email',
      password: 'Password123!',
      organizationName: 'Org',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing organization name', () => {
    const result = registerSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'Password123!',
      organizationName: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a password that is long enough but only one character class (weak)', () => {
    const result = registerSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'aaaaaaaaaaaa',
      organizationName: 'Org',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('auth.passwordTooWeak')
    }
  })

  it('accepts a password with exactly 3 of the 4 character classes (lower+upper+digit, no symbol)', () => {
    expect(
      registerSchema.safeParse({
        name: 'Ada',
        email: 'ada@example.com',
        password: 'Password123',
        organizationName: 'Org',
      }).success,
    ).toBe(true)
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials shape', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
  })

  it('rejects an empty password (login has no length minimum beyond presence)', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('requires a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true)
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('requires both a token and an 8+ char password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'Password123!' }).success).toBe(true)
    expect(resetPasswordSchema.safeParse({ token: '', password: 'Password123!' }).success).toBe(false)
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'short' }).success).toBe(false)
  })
})
