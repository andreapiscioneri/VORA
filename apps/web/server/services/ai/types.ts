import type { AIChatContext, CalendarEventSuggestion, ClassificationResult, ReplyDraft, SummaryResult, TaskSuggestion } from '~/shared/types/ai'

export interface WellbeingChatTurn {
  role: 'user' | 'assistant'
  content: string
}

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
  /**
   * Free-form supportive conversation for the Wellbeing module (distinct
   * from `chat()`, which only answers the VORA Assistant's fixed question
   * set over structured work data — see docs/AI.md). Yields response text
   * incrementally so the caller can stream it to the client; `history` is
   * the conversation so far, oldest first, not including the new message
   * being replied to.
   */
  wellbeingChat(history: WellbeingChatTurn[], message: string): AsyncIterable<string>
}
