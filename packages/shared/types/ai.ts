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
