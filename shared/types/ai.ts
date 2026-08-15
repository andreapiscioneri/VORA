export interface ClassificationResult {
  priority: 'urgent' | 'high' | 'medium' | 'low'
  category: 'support' | 'sales' | 'scheduling' | 'general'
  explanation: string
}

export interface TaskSuggestion {
  title: string
  deadline: string | null
  priority: 'urgent' | 'high' | 'medium' | 'low'
  explanation: string
}

export interface CalendarEventSuggestion {
  title: string
  date: string | null
  /** Best-guess "HH:mm" (24h), or null if no time-of-day could be inferred. */
  time: string | null
  durationMinutes: number
  explanation: string
}

export interface SummaryResult {
  summary: string
}

export interface ReplyDraft {
  body: string
}

/**
 * The subset of a user's live data the chat assistant reasons over. Kept as
 * small pre-shaped item lists (not the full entity types) so the AIService
 * contract doesn't change every time Task/CalendarEvent/etc. gain fields.
 */
export interface AIChatContext {
  todayItems: { time: string | null; title: string }[]
  highPriorityTasks: { title: string; priority: 'urgent' | 'high' | 'medium' | 'low' }[]
  unreadCommunications: { subject: string; preview: string }[]
  upcomingItems: { date: string; time: string | null; title: string }[]
}
