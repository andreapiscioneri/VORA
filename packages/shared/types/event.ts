export const RECURRENCE_FREQUENCIES = ['none', 'daily', 'weekly', 'monthly'] as const
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number]

export interface EventRecurrence {
  frequency: RecurrenceFrequency
  /** Repeat every N days/weeks/months, per `frequency`. Ignored when frequency is 'none'. */
  interval: number
  /** ISO date (inclusive). Null means "no end date" — expansion is capped at MAX_RECURRENCE_OCCURRENCES instead. */
  until: string | null
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  startAt: string
  endAt: string
  allDay: boolean
  location: string
  contactId: string | null
  /** IANA timezone the event's stated time is meaningful in (e.g. "Europe/Rome") — startAt/endAt are still stored as absolute UTC instants; this controls how they're *displayed*, so "15:00" reads as 15:00 in Rome regardless of the viewer's own timezone. */
  timezone: string
  recurrence: EventRecurrence
  /** Employee ids invited to the event, shown alongside it — the calendar
   * itself is already org-wide/shared, so this doesn't gate visibility,
   * it just records who's expected. */
  attendeeIds: string[]
  /** User who created the event — who gets the creation notification. */
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type CalendarEventInput = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
