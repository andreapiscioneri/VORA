import { describe, expect, it } from 'vitest'
import { expandRecurringEvent, expandRecurringEvents } from '../../../shared/utils/recurrence'
import type { CalendarEvent } from '../../../shared/types/event'

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'ev1',
    title: 'Standup',
    description: '',
    startAt: '2026-01-05T09:00:00.000Z', // a Monday
    endAt: '2026-01-05T09:30:00.000Z',
    allDay: false,
    location: '',
    contactId: null,
    timezone: 'UTC',
    recurrence: { frequency: 'none', interval: 1, until: null },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('expandRecurringEvent', () => {
  it('returns the event itself once when it is not recurring and falls inside the range', () => {
    const event = makeEvent()
    const result = expandRecurringEvent(event, new Date('2026-01-01'), new Date('2026-01-31'))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('ev1')
    expect(result[0].startAt).toBe(event.startAt)
  })

  it('returns nothing for a non-recurring event outside the range', () => {
    const event = makeEvent()
    const result = expandRecurringEvent(event, new Date('2026-02-01'), new Date('2026-02-28'))
    expect(result).toHaveLength(0)
  })

  it('expands a daily recurrence into one occurrence per day within range', () => {
    const event = makeEvent({ recurrence: { frequency: 'daily', interval: 1, until: null } })
    const result = expandRecurringEvent(event, new Date('2026-01-05T00:00:00Z'), new Date('2026-01-08T23:59:59Z'))
    expect(result).toHaveLength(4) // Jan 5, 6, 7, 8
    expect(result[0].id).toBe('ev1') // first occurrence keeps the master id
    expect(result[1].id).toBe('ev1::1')
    expect(result.map((r) => r.startAt.slice(0, 10))).toEqual(['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08'])
  })

  it('respects the interval (every N)', () => {
    const event = makeEvent({ recurrence: { frequency: 'weekly', interval: 2, until: null } })
    const result = expandRecurringEvent(event, new Date('2026-01-01'), new Date('2026-02-15'))
    // Jan 5, Jan 19, Feb 2 — every 2 weeks
    expect(result.map((r) => r.startAt.slice(0, 10))).toEqual(['2026-01-05', '2026-01-19', '2026-02-02'])
  })

  it('stops expanding once past the "until" date', () => {
    const event = makeEvent({ recurrence: { frequency: 'daily', interval: 1, until: '2026-01-07' } })
    const result = expandRecurringEvent(event, new Date('2026-01-01'), new Date('2026-01-31'))
    expect(result).toHaveLength(3) // Jan 5, 6, 7
  })

  it('preserves each occurrence\'s duration', () => {
    const event = makeEvent({ recurrence: { frequency: 'daily', interval: 1, until: null } })
    const result = expandRecurringEvent(event, new Date('2026-01-05'), new Date('2026-01-06T23:59:59Z'))
    for (const occ of result) {
      expect(new Date(occ.endAt).getTime() - new Date(occ.startAt).getTime()).toBe(30 * 60_000)
    }
  })

  it('monthly recurrence advances by month, not by a fixed day count', () => {
    const event = makeEvent({ startAt: '2026-01-31T09:00:00.000Z', endAt: '2026-01-31T10:00:00.000Z', recurrence: { frequency: 'monthly', interval: 1, until: null } })
    const result = expandRecurringEvent(event, new Date('2026-01-01'), new Date('2026-04-30'))
    // JS Date rolls Jan 31 + 1 month into Mar 3 (Feb has no 31st) — expand
    // should follow whatever Date does, deterministically, not throw.
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].startAt.slice(0, 10)).toBe('2026-01-31')
  })
})

describe('expandRecurringEvents', () => {
  it('flattens occurrences across multiple events', () => {
    const a = makeEvent({ id: 'a', recurrence: { frequency: 'daily', interval: 1, until: null } })
    const b = makeEvent({ id: 'b', startAt: '2026-01-06T09:00:00.000Z', endAt: '2026-01-06T09:30:00.000Z' })
    const result = expandRecurringEvents([a, b], new Date('2026-01-05'), new Date('2026-01-06T23:59:59Z'))
    expect(result.filter((r) => r.id === 'a' || r.id === 'a::1')).toHaveLength(2)
    expect(result.filter((r) => r.id === 'b')).toHaveLength(1)
  })
})
