import type { SearchResult } from '~/shared/types/search'
import { listAllContacts } from '~/server/utils/contacts'
import { listAllTasks } from '~/server/utils/tasks'
import { listAllAppointments } from '~/server/utils/appointments'
import { listAllTickets } from '~/server/utils/tickets'
import { listAllProjects } from '~/server/utils/projects'
import { listAllCommunications } from '~/server/utils/communications'
import { listAllDocuments } from '~/server/utils/knowledge'
import { resolveSession } from '~/server/utils/auth'

const MAX_PER_TYPE = 5

function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  return fields.some((f) => f?.toLowerCase().includes(query))
}

// Simple substring search over each module's org-scoped data, run in-memory
// after fetching (Firestore has no native full-text search). Fine at this
// scale; a real semantic/vector search would replace this function body
// without touching the API contract or the command palette that calls it.
export default defineEventHandler(async (event) => {
  const session = await resolveSession(event)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const { user } = session
  const organizationId = user.organizationId
  const q = getQuery(event).q
  const query = typeof q === 'string' ? q.trim().toLowerCase() : ''

  if (query.length < 2) return []

  const [contacts, tasks, appointments, tickets, projects, communications, documents] = await Promise.all([
    listAllContacts(organizationId),
    listAllTasks(organizationId),
    listAllAppointments(organizationId),
    listAllTickets(organizationId),
    listAllProjects(organizationId),
    listAllCommunications(organizationId),
    listAllDocuments(organizationId),
  ])

  const results: SearchResult[] = []

  for (const c of contacts) {
    if (results.filter((r) => r.type === 'contact').length >= MAX_PER_TYPE) break
    if (matches(query, c.firstName, c.lastName, c.company, c.email)) {
      results.push({ type: 'contact', id: c.id, title: `${c.firstName} ${c.lastName}`.trim(), subtitle: c.company, to: `/contacts/${c.id}` })
    }
  }

  for (const t of tasks) {
    if (results.filter((r) => r.type === 'task').length >= MAX_PER_TYPE) break
    if (matches(query, t.title, t.description)) {
      results.push({ type: 'task', id: t.id, title: t.title, subtitle: t.status, to: `/tasks` })
    }
  }

  for (const a of appointments) {
    if (results.filter((r) => r.type === 'appointment').length >= MAX_PER_TYPE) break
    if (matches(query, a.title, a.location)) {
      results.push({ type: 'appointment', id: a.id, title: a.title, subtitle: new Date(a.startAt).toLocaleDateString(), to: `/appointments` })
    }
  }

  for (const tk of tickets) {
    if (results.filter((r) => r.type === 'ticket').length >= MAX_PER_TYPE) break
    if (matches(query, tk.title, tk.description)) {
      results.push({ type: 'ticket', id: tk.id, title: tk.title, subtitle: tk.status, to: `/helpdesk/${tk.id}` })
    }
  }

  for (const p of projects) {
    if (results.filter((r) => r.type === 'project').length >= MAX_PER_TYPE) break
    if (matches(query, p.name, p.description)) {
      results.push({ type: 'project', id: p.id, title: p.name, subtitle: p.status, to: `/projects` })
    }
  }

  for (const c of communications) {
    if (results.filter((r) => r.type === 'communication').length >= MAX_PER_TYPE) break
    if (matches(query, c.subject, c.body)) {
      results.push({ type: 'communication', id: c.id, title: c.subject || c.body.slice(0, 60), subtitle: c.channel, to: `/inbox` })
    }
  }

  for (const d of documents) {
    if (results.filter((r) => r.type === 'knowledge').length >= MAX_PER_TYPE) break
    if (matches(query, d.title, d.content)) {
      results.push({ type: 'knowledge', id: d.id, title: d.title, subtitle: d.folder, to: `/knowledge/${d.id}` })
    }
  }

  return results
})
