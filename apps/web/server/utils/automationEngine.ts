import type { Automation, AutomationRunResult } from '~/shared/types/automation'
import type { Contact } from '~/shared/types/contact'
import { getEmailProvider } from '~/server/services/email'
import { createCommunication } from './communications'
import { updateContact } from './contacts'
import { createTask } from './tasks'
import { recordAutomationRun } from './automations'

/** Evaluates every condition step in the automation against the trigger
 * contact. A missing/empty steps list has no conditions to fail, so it
 * always passes — the automation runs unconditionally on its trigger. */
function conditionsMet(automation: Automation, contact: Contact): boolean {
  for (const step of automation.steps) {
    if (step.kind !== 'condition') continue

    const actual =
      step.field === 'status' ? contact.status : step.field === 'tag' ? contact.tags.join(',') : contact.source

    const matches =
      step.operator === 'equals'
        ? actual === step.value
        : step.operator === 'not_equals'
          ? actual !== step.value
          : actual.includes(step.value)

    if (!matches) return false
  }
  return true
}

/**
 * Executes an automation's action steps for real against the given contact —
 * no faked side effects. `delay` steps are NOT actually waited on: this app
 * has no background job queue, so a delay step is evaluated at trigger time
 * only (its wait is skipped, not simulated). That limitation is surfaced in
 * the automation builder UI, not hidden.
 */
export async function runAutomation(automation: Automation, contact: Contact, organizationId: string): Promise<AutomationRunResult> {
  if (!automation.active) return { ran: false, actionsExecuted: 0, reason: 'inactive' }
  if (!conditionsMet(automation, contact)) return { ran: false, actionsExecuted: 0, reason: 'condition_not_met' }

  let actionsExecuted = 0

  for (const step of automation.steps) {
    if (step.kind !== 'action') continue

    try {
      if (step.type === 'send_email' && contact.email) {
        const subject = step.config.subject ?? ''
        const body = step.config.body ?? ''
        const sendResult = await getEmailProvider().send({ to: contact.email, subject, body })
        await createCommunication(
          {
            channel: 'email',
            direction: 'outbound',
            contactId: contact.id,
            subject,
            body,
            status: 'read',
            sentAt: new Date().toISOString(),
            threadId: null,
            labels: ['automation'],
          },
          organizationId,
        )
        void sendResult
      } else if (step.type === 'add_tag' && step.config.tag) {
        const tags = contact.tags.includes(step.config.tag) ? contact.tags : [...contact.tags, step.config.tag]
        await updateContact(contact.id, { ...contactToInput(contact), tags }, organizationId)
      } else if (step.type === 'change_status' && step.config.status) {
        await updateContact(contact.id, { ...contactToInput(contact), status: step.config.status as Contact['status'] }, organizationId)
      } else if (step.type === 'create_task' && step.config.title) {
        await createTask(
          {
            title: step.config.title,
            description: `${automation.name} · ${contact.firstName} ${contact.lastName}`.trim(),
            priority: 'medium',
            status: 'todo',
            deadline: null,
            tags: [],
            checklist: [],
            contactId: contact.id,
            projectId: null,
            attachments: [],
          },
          organizationId,
        )
      }
      actionsExecuted++
    } catch {
      // One action failing shouldn't abort the rest of the automation or the
      // caller's own operation (e.g. contact creation) that triggered it.
    }
  }

  await recordAutomationRun(automation.id, organizationId)
  return { ran: true, actionsExecuted }
}

function contactToInput(contact: Contact) {
  const { id, createdAt, updatedAt, ...input } = contact
  return input
}

/** Runs every active automation matching a trigger type against a contact.
 * Wrapped so a broken automation never breaks the caller's own operation. */
export async function runAutomationsForTrigger(triggerType: string, contact: Contact, organizationId: string): Promise<void> {
  try {
    const { listActiveAutomationsForTrigger } = await import('./automations')
    const automations = await listActiveAutomationsForTrigger(organizationId, triggerType)
    for (const automation of automations) {
      await runAutomation(automation, contact, organizationId)
    }
  } catch {
    // Automation failures must never break the contact save that triggered them.
  }
}
