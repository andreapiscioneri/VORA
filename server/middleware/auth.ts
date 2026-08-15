// /api/whatsapp/webhook is called by Meta, not a logged-in user — it has
// no session cookie to check, and authenticates the request itself (verify
// token on GET, HMAC signature on POST; see server/api/whatsapp/webhook.*).
const PUBLIC_PREFIXES = ['/api/auth/', '/api/microsites/public/', '/api/_auth/', '/api/whatsapp/webhook']

export default defineEventHandler(async (event) => {
  const path = event.path || event.node.req.url || ''
  if (!path.startsWith('/api/')) return
  if (PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))) return

  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
})
