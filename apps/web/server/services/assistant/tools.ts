import { z } from 'zod'
import { TASK_PRIORITIES } from '~/shared/types/task'
import { taskInputSchema } from '~/shared/validation/task'
import { calendarEventInputSchema } from '~/shared/validation/event'
import { searchVora } from '~/server/utils/search'
import { listAllTasks, createTask } from '~/server/utils/tasks'
import { listAllEvents, createCalendarEvent } from '~/server/utils/events'

export interface AssistantToolContext {
  organizationId: string
  userId: string
}

export interface AssistantTool<Input = Record<string, unknown>> {
  name: string
  description: string
  inputSchema: z.ZodType<Input>
  // Read-only tools run immediately; anything that writes data pauses the
  // agent loop and asks the user to confirm first (see docs/AI.md and
  // server/services/assistant/agent.ts) — Claude proposes, it never acts
  // unilaterally on tools in this list.
  requiresConfirmation: boolean
  handler: (input: Input, ctx: AssistantToolContext) => Promise<unknown>
}

// Deliberately small and grounded in what Vora actually has today (tasks,
// calendar, cross-module search) — see docs/AI.md for why: the assistant
// must never claim a capability the app doesn't really have.
const searchTool: AssistantTool<{ query: string }> = {
  name: 'search_vora',
  description: "Cerca tra contatti, task, appuntamenti, ticket, progetti, comunicazioni e knowledge base dell'organizzazione dell'utente.",
  inputSchema: z.object({ query: z.string().min(1).describe('Testo da cercare') }),
  requiresConfirmation: false,
  handler: async (input, ctx) => searchVora(ctx.organizationId, input.query),
}

const listTasksTool: AssistantTool<{ onlyOpen?: boolean }> = {
  name: 'list_tasks',
  description: "Elenca i task dell'organizzazione dell'utente, con titolo, stato, priorità e scadenza.",
  inputSchema: z.object({
    onlyOpen: z.boolean().optional().describe('Se true, escludi i task completati o archiviati'),
  }),
  requiresConfirmation: false,
  handler: async (input, ctx) => {
    const tasks = await listAllTasks(ctx.organizationId)
    const filtered = input.onlyOpen ? tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived') : tasks
    return filtered.slice(0, 30).map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, deadline: t.deadline }))
  },
}

const createTaskTool: AssistantTool<{ title: string; deadline?: string | null; priority?: (typeof TASK_PRIORITIES)[number] }> = {
  name: 'create_task',
  description: 'Crea un nuovo task. Chiedi sempre conferma prima che venga eseguito.',
  inputSchema: z.object({
    title: z.string().trim().min(1).max(160),
    deadline: z.string().nullable().optional().describe('Data ISO YYYY-MM-DD, o assente se non specificata'),
    priority: z.enum(TASK_PRIORITIES).optional(),
  }),
  requiresConfirmation: true,
  handler: async (input, ctx) => {
    const parsed = taskInputSchema.parse({ title: input.title, deadline: input.deadline ?? null, priority: input.priority ?? 'medium' })
    const task = await createTask(parsed, ctx.organizationId)
    return { id: task.id, title: task.title, deadline: task.deadline, priority: task.priority }
  },
}

const listUpcomingEventsTool: AssistantTool<{ days?: number }> = {
  name: 'list_upcoming_events',
  description: "Elenca gli eventi di calendario dell'organizzazione nei prossimi N giorni (default 7).",
  inputSchema: z.object({ days: z.number().int().min(1).max(90).optional() }),
  requiresConfirmation: false,
  handler: async (input, ctx) => {
    const days = input.days ?? 7
    const now = Date.now()
    const until = now + days * 24 * 60 * 60 * 1000
    const events = await listAllEvents(ctx.organizationId)
    return events
      .filter((e) => {
        const t = new Date(e.startAt).getTime()
        return t >= now && t <= until
      })
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 30)
      .map((e) => ({ id: e.id, title: e.title, startAt: e.startAt, endAt: e.endAt, allDay: e.allDay, location: e.location }))
  },
}

const createCalendarEventTool: AssistantTool<{ title: string; startAt: string; endAt: string; allDay?: boolean; location?: string }> = {
  name: 'create_calendar_event',
  description: 'Crea un nuovo evento di calendario. Chiedi sempre conferma prima che venga eseguito.',
  inputSchema: z.object({
    title: z.string().trim().min(1).max(160),
    startAt: z.string().describe('Data/ora di inizio in formato ISO 8601'),
    endAt: z.string().describe('Data/ora di fine in formato ISO 8601'),
    allDay: z.boolean().optional(),
    location: z.string().max(200).optional(),
  }),
  requiresConfirmation: true,
  handler: async (input, ctx) => {
    const parsed = calendarEventInputSchema.parse({
      title: input.title,
      startAt: input.startAt,
      endAt: input.endAt,
      allDay: input.allDay ?? false,
      location: input.location ?? '',
    })
    const event = await createCalendarEvent(parsed, ctx.organizationId, ctx.userId)
    return { id: event.id, title: event.title, startAt: event.startAt, endAt: event.endAt }
  },
}

export const ASSISTANT_TOOLS: AssistantTool<any>[] = [
  searchTool,
  listTasksTool,
  createTaskTool,
  listUpcomingEventsTool,
  createCalendarEventTool,
]

export function getAssistantTool(name: string): AssistantTool<any> | undefined {
  return ASSISTANT_TOOLS.find((t) => t.name === name)
}
