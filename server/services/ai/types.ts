import type { AIChatContext, CalendarEventSuggestion, ClassificationResult, ReplyDraft, SummaryResult, TaskSuggestion } from '~/shared/types/ai'

/**
 * Abstraction over the AI backend. The rest of the app calls only these
 * methods — never a provider SDK directly — so a real LLM can be plugged
 * in later (see index.ts) without touching callers.
 */
export interface AIService {
  readonly name: string
  classifyMessage(text: string): Promise<ClassificationResult>
  extractTaskSuggestion(text: string): Promise<TaskSuggestion | null>
  extractCalendarEvent(text: string): Promise<CalendarEventSuggestion | null>
  summarize(text: string): Promise<SummaryResult>
  generateReply(text: string): Promise<ReplyDraft>
  chat(prompt: string, context: AIChatContext): Promise<string>
}
