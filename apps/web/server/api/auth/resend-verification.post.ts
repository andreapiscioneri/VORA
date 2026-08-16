import { createAuthToken } from '~/server/utils/authTokens'
import { getEmailProvider } from '~/server/services/email'
import { checkRateLimit } from '~/server/utils/rateLimit'

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  checkRateLimit(event, 'auth:resend-verification', { max: 3, windowMs: 10 * 60 * 1000 })

  const { user } = await requireUserSession(event)
  const appUrl = useRuntimeConfig().public.appUrl
  const token = await createAuthToken(user.id, 'verify-email', VERIFY_TOKEN_TTL_MS)

  await getEmailProvider().send({
    to: user.email,
    subject: 'Conferma il tuo indirizzo email — Vora',
    body: `Ciao ${user.name},\n\nConferma il tuo indirizzo email per Vora visitando questo link (valido 24 ore):\n${appUrl}/verify-email?token=${token}`,
  })

  return { success: true }
})
