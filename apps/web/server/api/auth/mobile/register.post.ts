import { registerSchema } from '~/shared/validation/auth'
import { createUserWithOrganization } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { createAuthToken } from '~/server/utils/authTokens'
import { getEmailProvider } from '~/server/services/email'
import { notifyRegistrationPending } from '~/server/utils/registrationNotify'

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

// Mobile-only counterpart to /api/auth/register.post.ts — see login.post.ts
// in this folder for why mobile has its own token-issuing routes instead
// of branching the web ones.
export default defineEventHandler(async (event) => {
  checkRateLimit(event, 'auth:mobile-register', { max: 5, windowMs: 10 * 60 * 1000 })

  const body = await readBody(event)
  const result = registerSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const { name, email, password, organizationName } = result.data
  const meta = {
    ip: getRequestIP(event, { xForwardedFor: true }) ?? 'unknown',
    userAgent: getRequestHeader(event, 'user-agent') ?? 'unknown',
    platform: 'mobile' as const,
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

  // Pending account — no token pair is issued here, same reasoning as the
  // web register route. The app shows a "waiting for approval" state.
  await notifyRegistrationPending(created.user, created.organization.name, meta)

  const appUrl = useRuntimeConfig().public.appUrl
  const verifyToken = await createAuthToken(created.user.id, 'verify-email', VERIFY_TOKEN_TTL_MS)
  await getEmailProvider().send({
    to: created.user.email,
    subject: 'Conferma il tuo indirizzo email — Vora',
    body: `Ciao ${created.user.name},\n\nConferma il tuo indirizzo email per Vora visitando questo link (valido 24 ore):\n${appUrl}/verify-email?token=${verifyToken}\n\nSe non hai richiesto tu questa registrazione, ignora questa email.`,
  })

  return { pending: true, user: created.user }
})
