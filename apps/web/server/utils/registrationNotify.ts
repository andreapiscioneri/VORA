import type { RegistrationMeta } from './auth'
import { listSuperadminEmails } from './auth'
import { createAuthToken } from './authTokens'
import { getEmailProvider } from '~/server/services/email'
import { logger } from './logger'

const REVIEW_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

// Fires once per new registration (web + mobile both call this — see
// register.post.ts and mobile/register.post.ts). The account is already
// 'pending' by the time this runs; this just gets a superadmin a link to
// review it. Never throws — a notification hiccup must not block
// registration itself, same principle as every other email send here.
export async function notifyRegistrationPending(
  user: { id: string; name: string; email: string },
  organizationName: string,
  meta: RegistrationMeta,
): Promise<void> {
  const superadminEmails = await listSuperadminEmails()
  if (superadminEmails.length === 0) {
    logger.warn('registration pending but no superadmin configured to review it', { userId: user.id })
    return
  }

  const appUrl = useRuntimeConfig().public.appUrl
  const token = await createAuthToken(user.id, 'registration-review', REVIEW_TOKEN_TTL_MS)
  const reviewUrl = `${appUrl}/admin/approve-registration?token=${token}`
  const requestedAt = new Date().toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'medium' })

  const body = [
    'Una nuova registrazione è in attesa di approvazione.',
    '',
    `Nome: ${user.name}`,
    `Email: ${user.email}`,
    `Organizzazione: ${organizationName}`,
    `Piattaforma: ${meta.platform === 'mobile' ? 'App mobile' : 'Web'}`,
    `Data e ora: ${requestedAt}`,
    `Indirizzo IP: ${meta.ip}`,
    `User agent: ${meta.userAgent}`,
    '',
    `Rivedi ed approva o rifiuta qui (link valido 7 giorni, richiede il login come superadmin):`,
    reviewUrl,
  ].join('\n')

  for (const to of superadminEmails) {
    await getEmailProvider().send({ to, subject: 'Richiesta approvazione registrazione account', body })
  }
}

export async function notifyRegistrationApproved(user: { name: string; email: string }): Promise<void> {
  const appUrl = useRuntimeConfig().public.appUrl
  await getEmailProvider().send({
    to: user.email,
    subject: 'Il tuo account Vora è stato approvato',
    body: `Ciao ${user.name},\n\nIl tuo account Vora è stato approvato ed è ora attivo. Puoi accedere qui:\n${appUrl}/login`,
  })
}
