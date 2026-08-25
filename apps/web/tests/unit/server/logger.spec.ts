import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from '../../../server/utils/logger'

afterEach(() => {
  vi.restoreAllMocks()
})

function lastLoggedEntry(spy: ReturnType<typeof vi.spyOn>) {
  const line = spy.mock.calls.at(-1)?.[0] as string
  return JSON.parse(line)
}

describe('logger', () => {
  it('emits info/debug as single-line JSON on console.log with a level and timestamp', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.info('user logged in', { userId: 'u1' })
    const entry = lastLoggedEntry(spy)
    expect(entry.level).toBe('info')
    expect(entry.message).toBe('user logged in')
    expect(entry.context).toEqual({ userId: 'u1' })
    expect(typeof entry.timestamp).toBe('string')
    expect(new Date(entry.timestamp).toString()).not.toBe('Invalid Date')
  })

  it('routes warn to console.warn and error to console.error', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.warn('rate limit approaching', { key: 'auth:login' })
    logger.error('send failed', { to: 'a@b.com' })
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('serializes a real Error into name/message/stack instead of losing it to [object Object]', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('gmail send failed', { to: 'a@b.com' }, new Error('boom'))
    const entry = lastLoggedEntry(spy)
    expect(entry.error.name).toBe('Error')
    expect(entry.error.message).toBe('boom')
    expect(typeof entry.error.stack).toBe('string')
  })

  it('omits the context and error keys entirely when not provided', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.info('heartbeat')
    const entry = lastLoggedEntry(spy)
    expect(entry).not.toHaveProperty('context')
    expect(entry).not.toHaveProperty('error')
  })

  it('handles a non-Error thrown value without crashing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('weird failure', {}, 'just a string')
    const entry = lastLoggedEntry(spy)
    expect(entry.error.message).toBe('just a string')
  })
})
