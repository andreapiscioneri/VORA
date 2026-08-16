import type { AIChatContext, CalendarEventSuggestion, ClassificationResult, ReplyDraft, SummaryResult, TaskSuggestion } from '~/shared/types/ai'
import type { AIService } from './types'

const URGENT_WORDS = ['urgente', 'urgent', 'asap', 'subito', 'immediat', 'emergenza', 'emergency', 'critico']
const HIGH_WORDS = ['importante', 'important', 'priorità', 'priority', 'entro oggi', 'scadenza']
const SUPPORT_WORDS = ['problema', 'bug', 'non funziona', 'errore', 'error', 'supporto', 'support', 'guasto', 'rotto']
const SALES_WORDS = ['preventivo', 'offerta', 'prezzo', 'price', 'contratto', 'acquist', 'quote', 'budget']
const SCHEDULING_WORDS = ['incontr', 'chiamata', 'call', 'riunione', 'meeting', 'disponibil', 'appuntamento', 'parlare']
const DEADLINE_WORDS = ['oggi', 'domani', 'entro', 'scadenza', 'deadline', 'venerdì', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'sabato', 'domenica']

const WEEKDAYS_IT = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

// Coarse time-of-day hints used when a message names a part of the day
// ("nel pomeriggio") rather than an exact clock time.
const TIME_OF_DAY_HINTS: [string, string][] = [
  ['mattina', '09:00'],
  ['mattinata', '09:00'],
  ['pomeriggio', '15:00'],
  ['sera', '18:00'],
  ['pranzo', '13:00'],
]

function extractTime(text: string): string | null {
  const lower = text.toLowerCase()

  // Exact clock time: "alle 15:30", "alle 9", "ore 14.00"
  const exact = lower.match(/(?:alle|ore)\s+(\d{1,2})(?:[:.](\d{2}))?/)
  if (exact) {
    const hour = Number(exact[1])
    const minute = exact[2] ? Number(exact[2]) : 0
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }
  }

  for (const [word, time] of TIME_OF_DAY_HINTS) {
    if (lower.includes(word)) return time
  }

  return null
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function includesAny(text: string, words: string[]): string | null {
  const lower = text.toLowerCase()
  return words.find((w) => lower.includes(w)) ?? null
}

function todayIso(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function extractDeadline(text: string): { date: string | null; matchedOn: string | null } {
  const lower = text.toLowerCase()

  if (lower.includes('oggi')) return { date: todayIso(0), matchedOn: 'oggi' }
  if (lower.includes('domani')) return { date: todayIso(1), matchedOn: 'domani' }

  const entroMatch = lower.match(/entro\s+(\d+)\s*giorn/)
  if (entroMatch) return { date: todayIso(Number(entroMatch[1])), matchedOn: entroMatch[0] }

  for (let i = 0; i < WEEKDAYS_IT.length; i++) {
    if (lower.includes(WEEKDAYS_IT[i])) {
      const today = new Date()
      const todayDow = today.getDay()
      let delta = i - todayDow
      if (delta <= 0) delta += 7
      return { date: todayIso(delta), matchedOn: WEEKDAYS_IT[i] }
    }
  }

  return { date: null, matchedOn: null }
}

/**
 * Rule-based AIService — no LLM call, no network request, no API key.
 * Deterministic keyword + pattern matching over the message text. This is
 * the default because no AI_API_KEY is configured; swap in a real LLM
 * provider in index.ts once one is available, without changing callers.
 */
export class HeuristicAIService implements AIService {
  readonly name = 'heuristic'

  async classifyMessage(text: string): Promise<ClassificationResult> {
    const urgentHit = includesAny(text, URGENT_WORDS)
    const highHit = includesAny(text, HIGH_WORDS)
    const deadlineHit = includesAny(text, DEADLINE_WORDS)

    let priority: ClassificationResult['priority'] = 'medium'
    let reason = 'nessuna parola chiave di urgenza rilevata, priorità di default'

    if (urgentHit) {
      priority = 'urgent'
      reason = `il messaggio contiene la parola "${urgentHit}"`
    } else if (highHit || deadlineHit) {
      priority = 'high'
      reason = `il messaggio menziona ${highHit ? `"${highHit}"` : `una scadenza ("${deadlineHit}")`}`
    }

    const supportHit = includesAny(text, SUPPORT_WORDS)
    const salesHit = includesAny(text, SALES_WORDS)
    const schedulingHit = includesAny(text, SCHEDULING_WORDS)

    let category: ClassificationResult['category'] = 'general'
    if (supportHit) category = 'support'
    else if (salesHit) category = 'sales'
    else if (schedulingHit) category = 'scheduling'

    return {
      priority,
      category,
      explanation: `Classificato come priorità ${priority} perché ${reason}.`,
    }
  }

  async extractTaskSuggestion(text: string): Promise<TaskSuggestion | null> {
    const trimmed = text.trim()
    if (!trimmed) return null

    const classification = await this.classifyMessage(trimmed)
    const { date, matchedOn } = extractDeadline(trimmed)

    const firstSentence = trimmed.split(/[.!?\n]/)[0].trim()
    const title = firstSentence.length > 5 ? firstSentence.slice(0, 120) : trimmed.slice(0, 120)

    return {
      title,
      deadline: date,
      priority: classification.priority,
      explanation: date
        ? `Scadenza rilevata da "${matchedOn}". ${classification.explanation}`
        : classification.explanation,
    }
  }

  async extractCalendarEvent(text: string): Promise<CalendarEventSuggestion | null> {
    const trimmed = text.trim()
    if (!trimmed) return null

    const classification = await this.classifyMessage(trimmed)
    if (classification.category !== 'scheduling') return null

    const { date, matchedOn } = extractDeadline(trimmed)
    const time = extractTime(trimmed)

    // "Chiamata"/"call" reads as a shorter, lighter-weight meeting than a
    // generic "riunione"/"incontro" — a rough but honest default, not a
    // real duration prediction.
    const isCall = /chiamata|call\b/i.test(trimmed)
    const durationMinutes = isCall ? 30 : 60

    const firstSentence = trimmed.split(/[.!?\n]/)[0].trim()
    const title = firstSentence.length > 5 ? firstSentence.slice(0, 120) : trimmed.slice(0, 120)

    const parts = [classification.explanation]
    if (matchedOn) parts.push(`Data rilevata da "${matchedOn}".`)
    if (time) parts.push(`Orario rilevato: ${time}.`)
    if (!date && !time) parts.push('Nessuna data o orario espliciti: verifica manualmente prima di confermare.')

    return { title, date, time, durationMinutes, explanation: parts.join(' ') }
  }

  async summarize(text: string): Promise<SummaryResult> {
    const trimmed = text.trim()
    if (!trimmed) return { summary: '' }

    // Extractive, not generative: picks the lead sentence plus any sentence
    // that carries a detected priority/deadline signal, rather than
    // synthesizing new text — an honest heuristic stand-in for a real
    // LLM summary.
    const sentences = splitSentences(trimmed)
    if (sentences.length <= 2) return { summary: trimmed.slice(0, 400) }

    const signalWords = [...URGENT_WORDS, ...HIGH_WORDS, ...DEADLINE_WORDS, ...SCHEDULING_WORDS]
    const notable = sentences.find((s, i) => i > 0 && includesAny(s, signalWords))

    const summary = [sentences[0], notable].filter(Boolean).join(' ')
    return { summary: summary.slice(0, 400) }
  }

  async generateReply(text: string): Promise<ReplyDraft> {
    const trimmed = text.trim()
    const classification = await this.classifyMessage(trimmed)

    // A template draft, not a generated response — the point is to give the
    // user a starting point to edit and send, never an auto-sent reply.
    const openers: Record<ClassificationResult['category'], string> = {
      support: 'Grazie per la segnalazione, mi occupo subito del problema e ti aggiorno a breve.',
      sales: 'Grazie per l\'interesse, ti preparo le informazioni richieste e ti ricontatto a breve.',
      scheduling: 'Grazie, per me va bene: confermo appena verifico la disponibilità in agenda.',
      general: 'Grazie per il messaggio, ho preso nota e ti rispondo a breve con i dettagli.',
    }

    const urgencyNote = classification.priority === 'urgent' || classification.priority === 'high'
      ? ' Ho visto che è una questione prioritaria, me ne occupo per primo.'
      : ''

    return { body: `${openers[classification.category]}${urgencyNote}` }
  }

  async chat(prompt: string, context: AIChatContext): Promise<string> {
    const lower = prompt.toLowerCase()

    if (/organizz|giornata|oggi/.test(lower)) {
      if (!context.todayItems.length) return 'Nessun impegno in programma per oggi. Puoi concentrarti sulle priorità.'
      return ['Ecco la tua giornata:', ...context.todayItems.map((i) => `${i.time ? `${i.time} — ` : ''}${i.title}`)].join('\n')
    }

    if (/priorit|important/.test(lower)) {
      if (!context.highPriorityTasks.length) return 'Nessuna attività ad alta priorità al momento.'
      return ['Le tue attività più importanti:', ...context.highPriorityTasks.map((t) => `${t.priority === 'urgent' ? 'Urgente' : 'Alta'} — ${t.title}`)].join('\n')
    }

    if (/non\s+lett|non\s+rispost|messagg/.test(lower)) {
      if (!context.unreadCommunications.length) return 'Sei in pari: nessun messaggio non letto.'
      return ['Messaggi da leggere:', ...context.unreadCommunications.map((c) => `${c.subject} — ${c.preview}`)].join('\n')
    }

    if (/prossim|impegn|agenda/.test(lower)) {
      if (!context.upcomingItems.length) return 'Nessun impegno in programma nei prossimi giorni.'
      return ['Prossimi impegni:', ...context.upcomingItems.map((i) => `${i.date} ${i.time ?? ''} — ${i.title}`.trim())].join('\n')
    }

    return 'Posso aiutarti a organizzare la giornata, trovare le attività più importanti, riepilogare i messaggi non letti o mostrarti i prossimi impegni. Prova a chiedermelo con queste parole.'
  }
}
