import { forgotPasswordSchema } from '~/shared/validation/auth'
import { findUserByEmail } from '~/server/utils/auth'
import { createAuthToken } from '~/server/utils/authTokens'
import { getEmailProvider } from '~/server/services/email'
import { checkRateLimit } from '~/server/utils/rateLimit'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  checkRateLimit(event, 'auth:forgot-password', { max: 5, windowMs: 10 * 60 * 1000 })

  const body = await readBody(event)
  const result = forgotPasswordSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'A valid email is required' })
  }

  const user = await findUserByEmail(result.data.email)

  // Always return success regardless of whether the email exists — an
  // account-enumeration leak here would let an attacker discover which
  // emails have Vora accounts just by probing this endpoint.
  if (user) {
    const appUrl = useRuntimeConfig().public.appUrl
    const token = await createAuthToken(user.id, 'reset-password', RESET_TOKEN_TTL_MS)
    await getEmailProvider().send({
      to: user.email,
      subject: 'Reimposta la password — Vora',
      body: `Ciao ${user.name},\n\nAbbiamo ricevuto una richiesta di reimpostazione password. Visita questo link (valido 1 ora) per sceglierne una nuova:\n${appUrl}/reset-password?token=${token}\n\nSe non hai richiesto tu questo, ignora questa email — la tua password resta invariata.`,
    })
  }

  return { success: true }
})
