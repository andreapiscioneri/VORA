import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import type { AIChatContext, CalendarEventSuggestion, ClassificationResult, ReplyDraft, SummaryResult, TaskSuggestion } from '~/shared/types/ai'
import type { AIService, WellbeingChatTurn } from './types'

const MODEL = 'claude-opus-5'

// Applies to every call in this service: the SDK's own default (10 min) is
// far too generous for a request/response API route or an SSE stream a
// browser tab is waiting on — a hung upstream call would otherwise hold the
// connection open long past any reasonable UX, and on Netlify Functions
// past the platform's own execution limit anyway.
const REQUEST_TIMEOUT_MS = 30_000

// wellbeingChat-only: retries apply only to failures before any token has
// streamed (see the loop below) — once text has reached the client,
// retrying would replay/duplicate what the user already saw.
const STREAM_RETRY_ATTEMPTS = 2
const STREAM_RETRY_DELAY_MS = 500

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Same retryable/non-retryable split as GmailEmailProvider (server/services/email/gmail.ts):
// transient (rate limit, overload, 5xx, timeout) is worth another attempt;
// a 400/401/etc. will fail identically on retry.
function isRetryable(error: unknown): boolean {
  const status = (error as { status?: number })?.status
  if (status === 429 || (typeof status === 'number' && status >= 500)) return true
  // The SDK throws a plain Error (no HTTP status) for a client-side timeout/abort.
  return error instanceof Error && /timeout|timed out|aborted/i.test(error.message)
}

const classificationSchema = z.object({
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  category: z.enum(['support', 'sales', 'scheduling', 'general']),
  explanation: z.string(),
})

const taskSuggestionSchema = z.object({
  found: z.boolean().describe('false if the text contains no actionable task'),
  title: z.string(),
  deadline: z.string().nullable().describe('ISO date YYYY-MM-DD, or null if none is stated or implied'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  explanation: z.string(),
})

const calendarEventSchema = z.object({
  found: z.boolean().describe('false if the text does not describe scheduling a meeting/call'),
  title: z.string(),
  date: z.string().nullable().describe('ISO date YYYY-MM-DD, or null if not stated or inferable'),
  time: z.string().nullable().describe('24h "HH:mm", or null if no time of day is stated or implied'),
  durationMinutes: z.number().int().positive(),
  explanation: z.string(),
})

const summarySchema = z.object({ summary: z.string() })
const replySchema = z.object({ body: z.string() })

/**
 * Real Claude-backed AIService. Every method calls the Messages API; none of
 * this app's callers changed to use it — they were already written against
 * the AIService interface (see index.ts). Structured methods use
 * `output_config.format` (a JSON-schema-constrained response, not a prefill)
 * so the model can't return malformed JSON; wellbeingChat streams instead,
 * since it's a live chat UI, not a single structured extraction.
 */
export class AnthropicAIService implements AIService {
  readonly name = 'anthropic'

  private readonly client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async classifyMessage(text: string): Promise<ClassificationResult> {
    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: 512,
      system:
        'Classifica il messaggio per priorità (urgent/high/medium/low) e categoria (support/sales/scheduling/general). Spiega sempre il motivo in italiano, in una frase.',
      messages: [{ role: 'user', content: text }],
      output_config: { format: zodOutputFormat(classificationSchema) },
    })
    return response.parsed_output ?? { priority: 'medium', category: 'general', explanation: 'Classificazione non disponibile.' }
  }

  async extractTaskSuggestion(text: string): Promise<TaskSuggestion | null> {
    const trimmed = text.trim()
    if (!trimmed) return null

    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: 512,
      system:
        'Estrai un\'attività (task) concreta da questo testo, se presente. Se il testo non descrive un\'azione da fare, imposta found=false. Rispondi in italiano.',
      messages: [{ role: 'user', content: trimmed }],
      output_config: { format: zodOutputFormat(taskSuggestionSchema) },
    })
    if (!response.parsed_output || !response.parsed_output.found) return null
    const { found: _found, ...suggestion } = response.parsed_output
    return suggestion
  }

  async extractCalendarEvent(text: string): Promise<CalendarEventSuggestion | null> {
    const trimmed = text.trim()
    if (!trimmed) return null

    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: 512,
      system:
        'Estrai un evento di calendario (riunione, chiamata, appuntamento) da questo testo, se presente. Se il testo non descrive la pianificazione di un incontro, imposta found=false. Rispondi in italiano.',
      messages: [{ role: 'user', content: trimmed }],
      output_config: { format: zodOutputFormat(calendarEventSchema) },
    })
    if (!response.parsed_output || !response.parsed_output.found) return null
    const { found: _found, ...suggestion } = response.parsed_output
    return suggestion
  }

  async summarize(text: string): Promise<SummaryResult> {
    const trimmed = text.trim()
    if (!trimmed) return { summary: '' }

    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: 512,
      system: 'Riassumi questo testo in italiano in 1-2 frasi, massimo 400 caratteri.',
      messages: [{ role: 'user', content: trimmed }],
      output_config: { format: zodOutputFormat(summarySchema) },
    })
    return response.parsed_output ?? { summary: trimmed.slice(0, 400) }
  }

  async generateReply(text: string): Promise<ReplyDraft> {
    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: 512,
      system:
        'Scrivi una bozza di risposta professionale e cordiale in italiano a questo messaggio. È solo un punto di partenza per l\'utente, che la rivedrà prima di inviarla — non promettere azioni specifiche non richieste.',
      messages: [{ role: 'user', content: text }],
      output_config: { format: zodOutputFormat(replySchema) },
    })
    return response.parsed_output ?? { body: '' }
  }

  async chat(prompt: string, context: AIChatContext): Promise<string> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        'Sei l\'assistente VORA. Rispondi solo usando i dati forniti qui sotto sul lavoro dell\'utente — non inventare impegni, attività o messaggi.',
        `Impegni di oggi: ${JSON.stringify(context.todayItems)}`,
        `Attività ad alta priorità: ${JSON.stringify(context.highPriorityTasks)}`,
        `Comunicazioni non lette: ${JSON.stringify(context.unreadCommunications)}`,
        `Prossimi impegni: ${JSON.stringify(context.upcomingItems)}`,
      ].join('\n'),
      messages: [{ role: 'user', content: prompt }],
    })
    const textBlock = response.content.find((block) => block.type === 'text')
    return textBlock?.type === 'text' ? textBlock.text : ''
  }

  async *wellbeingChat(history: WellbeingChatTurn[], message: string): AsyncIterable<string> {
    const params: Anthropic.MessageStreamParams = {
      model: MODEL,
      max_tokens: 1024,
      system: WELLBEING_SYSTEM_PROMPT,
      messages: [...history.map((turn) => ({ role: turn.role, content: turn.content })), { role: 'user' as const, content: message }],
    }

    for (let attempt = 1; attempt <= STREAM_RETRY_ATTEMPTS + 1; attempt++) {
      const stream = this.client.messages.stream(params, { timeout: REQUEST_TIMEOUT_MS })
      let yieldedAnything = false

      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yieldedAnything = true
            yield event.delta.text
          }
        }
        return
      } catch (error) {
        // Once any text reached the caller, the SSE consumer has already
        // shown it to the user — retrying here would re-send the opening of
        // the reply and read as a duplicated/garbled message. Surface the
        // error instead and let the caller's existing error handling
        // (server/api/wellbeing/chat.post.ts) take over.
        if (yieldedAnything || attempt > STREAM_RETRY_ATTEMPTS || !isRetryable(error)) {
          throw error
        }
        await wait(STREAM_RETRY_DELAY_MS * attempt)
      }
    }
  }
}

// A supportive listening space, explicitly not therapy — matches
// wellbeing.disclaimer in every locale file (see packages/shared and
// i18n/locales/*.json): VORA never diagnoses or claims to replace a
// healthcare professional. Includes a crisis-referral instruction because
// this is a free-form chat surface, unlike the heuristic engine's
// keyword-matched responses.
const WELLBEING_SYSTEM_PROMPT = `Sei un compagno di ascolto empatico all'interno di Vora, uno strumento di lavoro. Il tuo ruolo è offrire uno spazio di riflessione sul carico di lavoro e sullo stato generale della persona — NON sei un terapeuta e non fornisci diagnosi o piani di cura.

Linee guida:
- Rispondi sempre in italiano, con un tono caldo, calmo e non giudicante.
- Fai domande aperte per aiutare la persona a riflettere, invece di dare consigli non richiesti.
- Tieni le risposte brevi (2-5 frasi) — questa è una conversazione, non un saggio.
- Se la persona menziona intenzioni di farsi del male, autolesionismo, o pensieri suicidi, interrompi il tono conversazionale e indirizzala con urgenza e chiarezza verso un aiuto professionale reale (es. Telefono Amico 02 2327 2327 in Italia, o il numero di emergenza locale) — questa istruzione ha priorità su tutte le altre.
- Non sostituirti mai a un professionista della salute mentale; se la persona descrive un disagio persistente, suggerisci con gentilezza di parlarne con qualcuno di qualificato.`
