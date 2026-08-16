import { z } from 'zod'
import { getAIService } from '~/server/services/ai'
import { requireOrgId } from '~/server/utils/auth'
import { listAllTasks } from '~/server/utils/tasks'
import { listEvents } from '~/server/utils/events'
import { listAppointments } from '~/server/utils/appointments'
import { listAllCommunications } from '~/server/utils/communications'
import type { AIChatContext } from '~/shared/types/ai'

const schema = z.object({ prompt: z.string().trim().min(1, 'validation.required').max(2000) })

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const organizationId = await requireOrgId(event)
  const [tasks, events, appointments, communications] = await Promise.all([
    listAllTasks(organizationId),
    listEvents(organizationId),
    listAppointments(organizationId),
    listAllCommunications(organizationId),
  ])

  const today = todayIso()

  const context: AIChatContext = {
    todayItems: [
      ...appointments.filter((a) => a.startAt.slice(0, 10) === today).map((a) => ({ time: formatTime(a.startAt), title: a.title })),
      ...events.filter((e) => e.startAt.slice(0, 10) === today).map((e) => ({ time: e.allDay ? null : formatTime(e.startAt), title: e.title })),
      ...tasks.filter((t) => t.deadline === today && t.status !== 'completed').map((t) => ({ time: null, title: `Scadenza oggi — ${t.title}` })),
    ],
    highPriorityTasks: tasks
      .filter((t) => t.status !== 'completed' && t.status !== 'archived' && (t.priority === 'urgent' || t.priority === 'high'))
      .map((t) => ({ title: t.title, priority: t.priority })),
    unreadCommunications: communications
      .filter((c) => c.direction === 'inbound' && c.status === 'unread')
      .map((c) => ({ subject: c.subject || c.channel, preview: `${c.body.slice(0, 60)}${c.body.length > 60 ? '…' : ''}` })),
    upcomingItems: [...appointments, ...events]
      .filter((i) => new Date(i.startAt).getTime() >= Date.now())
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 5)
      .map((i) => ({
        date: new Date(i.startAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
        time: 'allDay' in i && i.allDay ? null : formatTime(i.startAt),
        title: i.title,
      })),
  }

  const reply = await getAIService().chat(result.data.prompt, context)
  return { reply, provider: getAIService().name }
})
