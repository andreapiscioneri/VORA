// Meta's webhook verification handshake, run once when you paste this
// endpoint's URL into the Meta App Dashboard (WhatsApp > Configuration >
// Webhook). Meta calls this with hub.mode=subscribe, hub.verify_token (a
// value you chose and typed into the dashboard), and hub.challenge (a
// random string). Echoing hub.challenge back proves you control the
// endpoint; the verify_token comparison proves it's really Meta (or at
// least someone who knows the secret you configured) calling it.
// See .env.example: WHATSAPP_WEBHOOK_SECRET. Real code — never exercised
// against a live Meta dashboard since no WhatsApp Business account is
// configured for this project (see docs/SECURITY.md).
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const mode = query['hub.mode']
  const verifyToken = query['hub.verify_token']
  const challenge = query['hub.challenge']

  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET

  if (!expectedSecret) {
    throw createError({ statusCode: 503, statusMessage: 'WhatsApp webhook not configured' })
  }

  if (mode !== 'subscribe' || verifyToken !== expectedSecret) {
    throw createError({ statusCode: 403, statusMessage: 'Webhook verification failed' })
  }

  setResponseHeader(event, 'Content-Type', 'text/plain')
  return String(challenge ?? '')
})
