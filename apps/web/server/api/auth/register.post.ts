import { registerSchema } from '~/shared/validation/auth'
import { createUserWithOrganization } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { createAuthToken } from '~/server/utils/authTokens'
import { getEmailProvider } from '~/server/services/email'
import { notifyRegistrationPending } from '~/server/utils/registrationNotify'

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  // Looser than login (registration is a rarer, more deliberate action) but
  // still bounded, to blunt automated mass-account creation.
  checkRateLimit(event, 'auth:register', { max: 5, windowMs: 10 * 60 * 1000 })

  const body = await readBody(event)
  const result = registerSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const { name, email, password, organizationName } = result.data
  const meta = {
    ip: getRequestIP(event, { xForwardedFor: true }) ?? 'unknown',
    userAgent: getRequestHeader(event, 'user-agent') ?? 'unknown',
    platform: 'web' as const,
  }

  let created
  try {
    created = await createUserWithOrganization(name, email, password, organizationName, meta)
  } catch (e) {
    if (e instanceof Error && e.message === 'auth.emailTaken') {
      throw createError({ statusCode: 409, statusMessage: 'Email already registered', data: { fieldErrors: { email: ['auth.emailTaken'] } } })
    }
    throw e
  }

  // New accounts sit at status 'pending' — no session is issued here.
  // The account only becomes usable once a superadmin approves it (see
  // registrationNotify.ts and server/api/admin/registrations/*).
  await notifyRegistrationPending(created.user, created.organization.name, meta)

  // Verification doesn't block login (see AUTH.md / SECURITY.md) — it's a
  // banner + a real endpoint, not a login gate that could lock someone out
  // if the mock/real email provider has a hiccup.
  const appUrl = useRuntimeConfig().public.appUrl
  const token = await createAuthToken(created.user.id, 'verify-email', VERIFY_TOKEN_TTL_MS)
  await getEmailProvider().send({
    to: created.user.email,
    subject: 'Conferma il tuo indirizzo email — Vora',
    body: `Ciao ${created.user.name},\n\nConferma il tuo indirizzo email per Vora visitando questo link (valido 24 ore):\n${appUrl}/verify-email?token=${token}\n\nSe non hai richiesto tu questa registrazione, ignora questa email.`,
  })

  return { pending: true, user: created.user, organization: created.organization }
})
