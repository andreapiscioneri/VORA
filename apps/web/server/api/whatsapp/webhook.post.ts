import { createHmac, timingSafeEqual } from 'node:crypto'
import { createCommunication } from '~/server/utils/communications'
import { findOrganizationByWhatsAppPhoneNumberId } from '~/server/utils/auth'

// Inbound WhatsApp Business Cloud API webhook. Real code, written against
// Meta's actual documented webhook shape — never exercised against a live
// Meta account since no WhatsApp Business API is configured for this
// project (same gap as OAuth/email providers; see docs/SECURITY.md).
//
// Meta signs every webhook POST with X-Hub-Signature-256: an HMAC-SHA256 of
// the *raw* request body, keyed with your Meta App Secret. We reuse
// WHATSAPP_WEBHOOK_SECRET for this (see .env.example) — verifying it is
// what proves the request actually came from Meta and wasn't forged, so an
// unsigned or mismatched request is rejected before any payload parsing.
function verifySignature(rawBody: string, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader?.startsWith('sha256=')) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const provided = signatureHeader.slice('sha256='.length)

  const expectedBuf = Buffer.from(expected, 'hex')
  const providedBuf = Buffer.from(provided, 'hex')
  if (expectedBuf.length !== providedBuf.length) return false

  return timingSafeEqual(expectedBuf, providedBuf)
}

interface ParsedInboundMessage {
  phoneNumberId: string
  from: string
  body: string
  timestamp: string
}

// WhatsApp Cloud API's real webhook shape is deeply nested and Meta
// reserves the right to add message types we don't recognize (images,
// reactions, statuses...) — this walks it defensively and returns an empty
// list rather than throwing on anything unexpected, since a thrown error
// here would make us 500 and Meta would retry/eventually disable the
// webhook.
function parseInboundMessages(payload: unknown): ParsedInboundMessage[] {
  const messages: ParsedInboundMessage[] = []
  if (!payload || typeof payload !== 'object') return messages

  const entries = (payload as Record<string, unknown>).entry
  if (!Array.isArray(entries)) return messages

  for (const entry of entries) {
    const changes = entry?.changes
    if (!Array.isArray(changes)) continue

    for (const change of changes) {
      const value = change?.value
      const phoneNumberId = value?.metadata?.phone_number_id
      const waMessages = value?.messages
      if (typeof phoneNumberId !== 'string' || !Array.isArray(waMessages)) continue

      for (const msg of waMessages) {
        if (typeof msg?.from !== 'string') continue
        const body = typeof msg?.text?.body === 'string' ? msg.text.body : `[${msg?.type ?? 'unsupported'} message]`
        const timestamp = typeof msg?.timestamp === 'string' ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString()
        messages.push({ phoneNumberId, from: msg.from, body, timestamp })
      }
    }
  }

  return messages
}

export default defineEventHandler(async (event) => {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET
  if (!secret) {
    throw createError({ statusCode: 503, statusMessage: 'WhatsApp webhook not configured' })
  }

  const rawBody = await readRawBody(event, 'utf8')
  if (!rawBody) {
    throw createError({ statusCode: 401, statusMessage: 'Missing request body' })
  }

  const signatureHeader = getRequestHeader(event, 'x-hub-signature-256')
  if (!verifySignature(rawBody, signatureHeader, secret)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid webhook signature' })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    // Signed but not valid JSON — ack anyway, same "don't make Meta retry
    // forever" reasoning as the unrecognized-shape case below.
    setResponseStatus(event, 200)
    return { received: true }
  }

  const messages = parseInboundMessages(payload)

  for (const message of messages) {
    const organizationId = await findOrganizationByWhatsAppPhoneNumberId(message.phoneNumberId)
    if (!organizationId) {
      // No org has connected this WhatsApp Business phone number yet.
      // Nothing to attach the message to — drop it, still ack the webhook.
      continue
    }

    await createCommunication(
      {
        channel: 'whatsapp',
        direction: 'inbound',
        contactId: null,
        subject: '',
        body: message.body,
        status: 'unread',
        sentAt: message.timestamp,
        threadId: null,
        labels: [],
      },
      organizationId,
    )
  }

  // Always 200 on a validly-signed request, even if nothing recognizable
  // was found in the payload — Meta requires a fast ack and will disable
  // the webhook after repeated non-200 responses.
  setResponseStatus(event, 200)
  return { received: true }
})
