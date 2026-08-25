import { registerSchema } from '~/shared/validation/auth'
import { createUserWithOrganization } from '~/server/utils/auth'
import { signAccessToken, createRefreshToken } from '~/server/utils/mobileTokens'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { createAuthToken } from '~/server/utils/authTokens'
import { getEmailProvider } from '~/server/services/email'

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

  let created
  try {
    created = await createUserWithOrganization(name, email, password, organizationName)
  } catch (e) {
    if (e instanceof Error && e.message === 'auth.emailTaken') {
      throw createError({ statusCode: 409, statusMessage: 'Email already registered', data: { fieldErrors: { email: ['auth.emailTaken'] } } })
    }
    throw e
  }

  const { token: accessToken, expiresAt } = signAccessToken(created.user.id)
  const refreshToken = await createRefreshToken(created.user.id)

  const appUrl = useRuntimeConfig().public.appUrl
  const verifyToken = await createAuthToken(created.user.id, 'verify-email', VERIFY_TOKEN_TTL_MS)
  await getEmailProvider().send({
    to: created.user.email,
    subject: 'Conferma il tuo indirizzo email — Vora',
    body: `Ciao ${created.user.name},\n\nConferma il tuo indirizzo email per Vora visitando questo link (valido 24 ore):\n${appUrl}/verify-email?token=${verifyToken}\n\nSe non hai richiesto tu questa registrazione, ignora questa email.`,
  })

  return {
    user: { ...created.user, organizationId: created.organization.id, organizationName: created.organization.name, role: created.membership.role },
    accessToken,
    accessTokenExpiresAt: expiresAt,
    refreshToken,
  }
})
