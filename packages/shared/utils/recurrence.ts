import type { CalendarEvent } from '../types/event'

// A recurring event is stored once (the "master") and expanded into
// individual occurrences for display — never duplicated in Firestore.
// Hard cap so an "every day, no end date" event can't generate unbounded
// occurrences; a year of daily events is already 365, comfortably under this.
const MAX_RECURRENCE_OCCURRENCES = 400

function addInterval(date: Date, frequency: 'daily' | 'weekly' | 'monthly', interval: number): Date {
  const next = new Date(date)
  if (frequency === 'daily') next.setDate(next.getDate() + interval)
  else if (frequency === 'weekly') next.setDate(next.getDate() + interval * 7)
  else next.setMonth(next.getMonth() + interval)
  return next
}

/**
 * Expands a (possibly recurring) event into its concrete occurrences that
 * fall within [rangeStart, rangeEnd]. A non-recurring event returns itself
 * (0 or 1 items). Each occurrence keeps the master event's id with a
 * `::N` suffix so it's still traceable back to the source event, but is
 * otherwise a normal CalendarEvent the UI can render like any other.
 */
export function expandRecurringEvent(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  const masterStart = new Date(event.startAt)
  const durationMs = new Date(event.endAt).getTime() - masterStart.getTime()

  if (event.recurrence.frequency === 'none') {
    return masterStart <= rangeEnd && new Date(event.endAt) >= rangeStart ? [event] : []
  }

  // "until" is picked as a bare date (a <input type="date">), meant as an
  // inclusive end day — treat it as end-of-day so an occurrence later that
  // same day isn't dropped just because its time-of-day is past midnight.
  const until = event.recurrence.until ? new Date(`${event.recurrence.until}T23:59:59.999Z`) : null
  const occurrences: CalendarEvent[] = []
  let cursor = new Date(masterStart)

  for (let i = 0; i < MAX_RECURRENCE_OCCURRENCES; i++) {
    if (until && cursor > until) break
    if (cursor > rangeEnd) break

    const occurrenceEnd = new Date(cursor.getTime() + durationMs)
    if (occurrenceEnd >= rangeStart) {
      occurrences.push({
        ...event,
        id: i === 0 ? event.id : `${event.id}::${i}`,
        startAt: cursor.toISOString(),
        endAt: occurrenceEnd.toISOString(),
      })
    }

    cursor = addInterval(cursor, event.recurrence.frequency, event.recurrence.interval)
  }

  return occurrences
}

/** Expands every event in a list against the same range and flattens the result. */
export function expandRecurringEvents(events: CalendarEvent[], rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  return events.flatMap((e) => expandRecurringEvent(e, rangeStart, rangeEnd))
}
