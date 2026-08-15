#!/usr/bin/env node
// Seeds a fresh VORA organization with realistic (never real) fake data
// across every core module, by calling the real REST API — the same
// validation, multi-tenancy scoping, and business logic the app itself
// uses, not a Firestore backdoor. Needs the dev server running:
//
//   yarn dev                 # terminal 1
//   node scripts/seed.mjs    # terminal 2
//
// Idempotent-ish: re-running registers a new demo organization each time
// (the email has a timestamp suffix) rather than duplicating data into an
// existing one, since there's no natural "already seeded" marker to check.

const BASE = process.env.VORA_SEED_BASE_URL || 'http://localhost:3100/api'
const stamp = Date.now().toString(36)

let cookie = ''

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`)
  }
  if (res.status === 204) return null
  return res.json()
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

async function main() {
  console.log(`Seeding against ${BASE} ...`)

  const { user, organization } = await api('POST', '/auth/register', {
    name: 'Demo Owner',
    email: `demo-${stamp}@vora.test`,
    password: 'DemoPass1234',
    organizationName: `Vora Demo ${stamp}`,
  })
  console.log(`Created organization "${organization.name}" (user: ${user.email})`)

  // --- Contacts -----------------------------------------------------------
  const contactSeeds = [
    { firstName: 'Elena', lastName: 'Ferrari', company: 'Nord Logistics', role: 'Operations Lead', email: 'elena.ferrari@nordlogistics.example' },
    { firstName: 'Marco', lastName: 'Bianchi', company: 'Bianchi Studio', role: 'Founder', email: 'marco@bianchistudio.example' },
    { firstName: 'Sofia', lastName: 'Romano', company: 'Romano & Co', role: 'CFO', email: 'sofia.romano@romanoco.example' },
    { firstName: 'Luca', lastName: 'Conti', company: 'Conti Manufacturing', role: 'Plant Manager', email: 'luca.conti@contimfg.example' },
    { firstName: 'Giulia', lastName: 'Esposito', company: 'Esposito Retail', role: 'Marketing Director', email: 'giulia.esposito@espositoretail.example' },
    { firstName: 'Davide', lastName: 'Greco', company: 'Greco Consulting', role: 'Partner', email: 'davide.greco@grecoconsulting.example' },
  ]
  const contacts = []
  for (const c of contactSeeds) {
    contacts.push(
      await api('POST', '/contacts', {
        ...c,
        phone: '', whatsapp: '', website: '', address: '', notes: '',
        tags: [], status: 'active', source: 'manual', lastContactAt: null, nextActivityAt: null,
      })
    )
  }
  console.log(`  ${contacts.length} contacts`)

  // --- Opportunities (CRM) -------------------------------------------------
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won']
  const opportunities = []
  for (let i = 0; i < 5; i++) {
    const contact = contacts[i % contacts.length]
    opportunities.push(
      await api('POST', '/opportunities', {
        title: `${contact.company} — implementazione VORA`,
        contactId: contact.id,
        company: contact.company,
        value: 8000 + i * 3500,
        currency: 'EUR',
        probability: [20, 40, 60, 80, 100][i],
        stage: stages[i],
        source: 'manual',
        notes: '',
        expectedCloseDate: daysFromNow(30 + i * 10),
      })
    )
  }
  console.log(`  ${opportunities.length} opportunities`)

  // --- Projects -------------------------------------------------------------
  const projectSeeds = [
    { name: 'Onboarding Nord Logistics', description: 'Migrazione dati e formazione team operativo.', status: 'active' },
    { name: 'Sito vetrina Bianchi Studio', description: 'Redesign completo del sito pubblico.', status: 'active' },
    { name: 'Automazione fatturazione Romano & Co', description: 'Integrazione flussi contabili.', status: 'on_hold' },
  ]
  const projects = []
  for (const p of projectSeeds) {
    projects.push(
      await api('POST', '/projects', {
        ...p,
        contactId: contacts[projects.length % contacts.length].id,
        startDate: daysFromNow(-20),
        dueDate: daysFromNow(40),
        budget: 12000,
      })
    )
  }
  console.log(`  ${projects.length} projects`)

  // --- Tasks -----------------------------------------------------------------
  const taskSeeds = [
    { title: 'Preparare proposta commerciale', priority: 'high', status: 'todo' },
    { title: 'Configurare ambiente di staging', priority: 'medium', status: 'in_progress' },
    { title: 'Rivedere contratto con legale', priority: 'urgent', status: 'review' },
    { title: 'Follow-up post demo', priority: 'medium', status: 'todo' },
    { title: 'Importare dati storici cliente', priority: 'low', status: 'todo' },
    { title: 'Sessione formazione team', priority: 'high', status: 'todo' },
    { title: 'Chiudere ticket #124', priority: 'medium', status: 'completed' },
    { title: 'Aggiornare knowledge base onboarding', priority: 'low', status: 'in_progress' },
  ]
  const tasks = []
  for (const [i, t] of taskSeeds.entries()) {
    tasks.push(
      await api('POST', '/tasks', {
        ...t,
        description: '',
        deadline: i % 2 === 0 ? daysFromNow(3 + i) : null,
        tags: [],
        checklist: [],
        contactId: contacts[i % contacts.length].id,
        projectId: projects[i % projects.length].id,
      })
    )
  }
  console.log(`  ${tasks.length} tasks`)

  // --- Appointments -----------------------------------------------------------
  const appointments = []
  for (let i = 0; i < 4; i++) {
    appointments.push(
      await api('POST', '/appointments', {
        title: `Call con ${contacts[i].firstName} ${contacts[i].lastName}`,
        contactId: contacts[i].id,
        opportunityId: opportunities[i % opportunities.length]?.id ?? null,
        startAt: daysFromNow(1 + i),
        durationMinutes: 30,
        location: '',
        videoCallUrl: '',
        notes: '',
        status: 'scheduled',
      })
    )
  }
  console.log(`  ${appointments.length} appointments`)

  // --- Communications (unified inbox) -----------------------------------------
  const commSeeds = [
    { channel: 'email', direction: 'inbound', subject: 'Richiesta preventivo', body: 'Buongiorno, potreste inviarci un preventivo aggiornato?' },
    { channel: 'email', direction: 'outbound', subject: 'Re: Richiesta preventivo', body: 'Certo, trovate il preventivo in allegato.' },
    { channel: 'whatsapp', direction: 'inbound', subject: '', body: 'Ciao, possiamo sentirci domani pomeriggio?' },
    { channel: 'whatsapp', direction: 'outbound', subject: '', body: 'Certo, ti va bene alle 15:00?' },
    { channel: 'email', direction: 'inbound', subject: 'Problema urgente sul progetto', body: 'Il progetto ha un problema urgente da risolvere entro oggi.' },
    { channel: 'internal', direction: 'inbound', subject: 'Nota interna', body: 'Promemoria: rinnovo contratto in scadenza tra 2 settimane.' },
  ]
  const communications = []
  for (const [i, c] of commSeeds.entries()) {
    communications.push(
      await api('POST', '/communications', {
        ...c,
        contactId: contacts[i % contacts.length].id,
        status: c.direction === 'inbound' ? 'unread' : 'read',
        sentAt: daysFromNow(-i),
      })
    )
  }
  console.log(`  ${communications.length} communications`)

  // --- Helpdesk tickets ---------------------------------------------------
  const ticketSeeds = [
    { title: 'Impossibile accedere al portale clienti', priority: 'high', status: 'open', category: 'technical' },
    { title: 'Fattura duplicata', priority: 'medium', status: 'in_progress', category: 'billing' },
    { title: 'Richiesta nuova funzionalità export PDF', priority: 'low', status: 'open', category: 'feature_request' },
    { title: 'Domanda su piano tariffario', priority: 'low', status: 'resolved', category: 'general' },
  ]
  const tickets = []
  for (const [i, t] of ticketSeeds.entries()) {
    tickets.push(await api('POST', '/tickets', { ...t, description: '', contactId: contacts[i % contacts.length].id, comments: [] }))
  }
  console.log(`  ${tickets.length} tickets`)

  // --- Knowledge base -------------------------------------------------------
  const knowledgeSeeds = [
    { title: 'Procedura di onboarding cliente', content: '# Onboarding\n\n1. Registrazione account\n2. Import dati\n3. Formazione team.', folder: 'Processi' },
    { title: 'FAQ fatturazione', content: '# FAQ\n\n**Quando viene emessa la fattura?**\nIl 1° di ogni mese.', folder: 'Amministrazione' },
    { title: 'Guida rapida CRM', content: '# CRM\n\nCome spostare un\'opportunità nella pipeline.', folder: 'Prodotto' },
  ]
  const knowledge = []
  for (const k of knowledgeSeeds) {
    knowledge.push(await api('POST', '/knowledge', { ...k, tags: [], favorite: false }))
  }
  console.log(`  ${knowledge.length} knowledge documents`)

  // --- Employees + leave requests -------------------------------------------
  const employeeSeeds = [
    { firstName: 'Anna', lastName: 'Moretti', email: 'anna.moretti@vora-demo.example', role: 'Account Manager', team: 'Sales' },
    { firstName: 'Paolo', lastName: 'Ricci', email: 'paolo.ricci@vora-demo.example', role: 'Software Engineer', team: 'Engineering' },
    { firstName: 'Chiara', lastName: 'Marino', email: 'chiara.marino@vora-demo.example', role: 'Customer Success', team: 'Support' },
  ]
  const employees = []
  for (const e of employeeSeeds) {
    employees.push(await api('POST', '/employees', { ...e, status: 'active', startDate: daysFromNow(-200) }))
  }
  console.log(`  ${employees.length} employees`)

  const leaveRequests = []
  for (const [i, e] of employees.entries()) {
    leaveRequests.push(
      await api('POST', '/leave-requests', {
        requesterName: `${e.firstName} ${e.lastName}`,
        type: ['vacation', 'sick', 'personal'][i % 3],
        startDate: daysFromNow(10 + i * 5),
        endDate: daysFromNow(14 + i * 5),
        status: 'pending',
        notes: '',
      })
    )
  }
  console.log(`  ${leaveRequests.length} leave requests`)

  // --- Timesheets -------------------------------------------------------------
  const timesheets = []
  for (let i = 0; i < 6; i++) {
    timesheets.push(
      await api('POST', '/timesheets', {
        projectId: projects[i % projects.length].id,
        taskId: tasks[i % tasks.length].id,
        description: 'Lavoro svolto sul progetto',
        date: daysFromNow(-i),
        durationMinutes: 60 + i * 15,
        billable: i % 2 === 0,
      })
    )
  }
  console.log(`  ${timesheets.length} timesheet entries`)

  // --- Expenses -----------------------------------------------------------
  const expenseSeeds = [
    { amount: 45.5, category: 'meals', notes: 'Pranzo cliente' },
    { amount: 320, category: 'travel', notes: 'Treno per meeting' },
    { amount: 89.99, category: 'software', notes: 'Licenza strumento design' },
  ]
  const expenses = []
  for (const [i, ex] of expenseSeeds.entries()) {
    expenses.push(
      await api('POST', '/expenses', {
        ...ex,
        currency: 'EUR',
        date: daysFromNow(-i * 3),
        projectId: projects[i % projects.length].id,
        contactId: null,
        status: 'pending',
        receiptUrl: '',
      })
    )
  }
  console.log(`  ${expenses.length} expenses`)

  // --- Calendar events ------------------------------------------------------
  const events = []
  for (let i = 0; i < 4; i++) {
    events.push(
      await api('POST', '/events', {
        title: `Riunione team #${i + 1}`,
        description: '',
        startAt: daysFromNow(2 + i),
        endAt: daysFromNow(2 + i),
        allDay: false,
        location: '',
        contactId: null,
      })
    )
  }
  console.log(`  ${events.length} calendar events`)

  console.log('\nDone. Log in with:')
  console.log(`  email:    demo-${stamp}@vora.test`)
  console.log(`  password: DemoPass1234`)
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message)
  process.exit(1)
})
