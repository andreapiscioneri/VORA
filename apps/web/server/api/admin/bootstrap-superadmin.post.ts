import { findUserByEmail, listSuperadminEmails, grantSuperadmin } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/utils/rateLimit'

// One-time bootstrap for the very first superadmin: every other way to grant
// that role (server/api/admin/registrations/approve.post.ts) requires an
// *existing* superadmin's session, which is a chicken-and-egg problem the
// very first one can't satisfy. This endpoint breaks that loop, guarded two
// ways: a shared secret (SUPERADMIN_BOOTSTRAP_SECRET, set once in the deploy
// environment — never committed) and a hard idempotency check that refuses
// to run at all once any superadmin already exists. That second guard is
// the real safety net: even a leaked secret can't be used to mint a second
// superadmin or re-target an existing one.
export default defineEventHandler(async (event) => {
  checkRateLimit(event, 'admin:bootstrap-superadmin', { max: 5, windowMs: 60 * 60 * 1000 })

  const configuredSecret = process.env.SUPERADMIN_BOOTSTRAP_SECRET
  if (!configuredSecret) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const body = await readBody<{ email?: string; secret?: string }>(event)
  if (!body?.email || !body?.secret) {
    throw createError({ statusCode: 422, statusMessage: 'email and secret are required' })
  }
  if (body.secret !== configuredSecret) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid secret' })
  }

  const existingSuperadmins = await listSuperadminEmails()
  if (existingSuperadmins.length > 0) {
    throw createError({ statusCode: 409, statusMessage: 'A superadmin already exists — this endpoint only bootstraps the first one' })
  }

  const user = await findUserByEmail(body.email)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'No account with that email — register it first' })
  }

  await grantSuperadmin(user.id)

  return { success: true, id: user.id, email: user.email }
})
