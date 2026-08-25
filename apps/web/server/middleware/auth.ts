import { getMethod, getRequestHeader } from 'h3'
import { resolveSession } from '~/server/utils/auth'
import { hasValidOrigin, MUTATING_METHODS } from '~/server/utils/csrf'

// /api/whatsapp/webhook is called by Meta, not a logged-in user — it has
// no session cookie to check, and authenticates the request itself (verify
// token on GET, HMAC signature on POST; see server/api/whatsapp/webhook.*).
const PUBLIC_PREFIXES = ['/api/auth/', '/api/microsites/public/', '/api/_auth/', '/api/whatsapp/webhook']

export default defineEventHandler(async (event) => {
  const path = event.path || event.node.req.url || ''
  if (!path.startsWith('/api/')) return
  if (PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))) return

  // resolveSession accepts either a web session cookie or a mobile bearer
  // access token (see server/utils/auth.ts) — this gate and every route's
  // own requireOrgId/requireRole call resolve identically, so a route
  // never has to know which client type is calling it.
  const session = await resolveSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const isBearerAuth = getRequestHeader(event, 'authorization')?.startsWith('Bearer ')
  if (!isBearerAuth && MUTATING_METHODS.has(getMethod(event)) && !hasValidOrigin(event)) {
    throw createError({ statusCode: 403, statusMessage: 'Cross-site request rejected' })
  }
})
