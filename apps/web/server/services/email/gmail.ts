import { google } from 'googleapis'
import type { EmailAttachment, EmailProvider, SendEmailInput, SendEmailResult } from './types'
import { logger } from '~/server/utils/logger'

// Keeps a single hung/huge attachment fetch from blocking (or ballooning)
// a send — same reasoning as REQUEST_TIMEOUT_MS in the Claude service.
const ATTACHMENT_FETCH_TIMEOUT_MS = 15_000
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024 // Gmail's own per-message cap

export interface GmailProviderConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  senderEmail: string
}

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 500

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Errors worth retrying are transport/quota hiccups, not permanent
// rejections (bad address, auth failure) — retrying those would just
// waste the attempt budget on a request that can never succeed.
export function isRetryable(error: unknown): boolean {
  const status = (error as { code?: number; status?: number })?.code ?? (error as { status?: number })?.status
  return status === 429 || (typeof status === 'number' && status >= 500)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Wraps a plain-text body (the shape every caller already sends — see
// server/services/email/types.ts) in a minimal branded HTML shell, so a
// real send looks like a real product email instead of a bare text blob.
// Blank lines become paragraph breaks; single newlines become <br>.
function renderHtmlBody(plainTextBody: string): string {
  const paragraphs = plainTextBody
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0a0a0a;padding:20px 32px;">
                <span style="color:#39ff6a;font-size:18px;font-weight:700;">Vora</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#18181b;font-size:15px;line-height:1.6;">
                ${paragraphs}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function toBase64Url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

interface FetchedAttachment {
  filename: string
  contentType: string
  base64Data: string
}

// Attachments are stored as {title, url} (see EmailAttachment in ./types) —
// fetching happens here, right before sending, rather than at attach-time,
// so a stale/dead link only fails the specific send instead of silently
// corrupting stored data earlier.
async function fetchAttachment(attachment: EmailAttachment): Promise<FetchedAttachment> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ATTACHMENT_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(attachment.url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`attachment fetch failed: ${response.status} ${attachment.url}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > MAX_ATTACHMENT_BYTES) {
      throw new Error(`attachment too large (${buffer.byteLength} bytes): ${attachment.url}`)
    }
    const filename = attachment.title.trim() || attachment.url.split('/').pop() || 'attachment'
    return {
      filename,
      contentType: response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream',
      base64Data: buffer.toString('base64'),
    }
  } finally {
    clearTimeout(timer)
  }
}

// Builds a multipart/alternative RFC 2822 message: a plain-text part (the
// input body verbatim) plus an HTML part (the same body through the
// template above), so clients that prefer plain text still get one. When
// attachments are present, that alternative part is nested one level
// inside a multipart/mixed envelope alongside the attachment parts — the
// standard structure for "styled body + files" (a single multipart/mixed
// can't itself offer plain-text/HTML alternatives for the body).
export async function buildMimeMessage(from: string, input: SendEmailInput): Promise<string> {
  const altBoundary = `vora_alt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const encodedSubject = `=?UTF-8?B?${Buffer.from(input.subject, 'utf-8').toString('base64')}?=`

  const alternativePart = [
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    input.body,
    '',
    `--${altBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    renderHtmlBody(input.body),
    '',
    `--${altBoundary}--`,
  ].join('\r\n')

  if (!input.attachments?.length) {
    return [
      `From: Vora <${from}>`,
      `To: ${input.to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      '',
      alternativePart,
    ].join('\r\n')
  }

  const fetched = await Promise.all(input.attachments.map(fetchAttachment))
  const mixedBoundary = `vora_mixed_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  const attachmentParts = fetched.map((file) =>
    [
      `--${mixedBoundary}`,
      `Content-Type: ${file.contentType}; name="${file.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${file.filename}"`,
      '',
      file.base64Data,
    ].join('\r\n'),
  )

  return [
    `From: Vora <${from}>`,
    `To: ${input.to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    '',
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    alternativePart,
    '',
    ...attachmentParts,
    `--${mixedBoundary}--`,
  ].join('\r\n')
}

/**
 * Sends real email via the Gmail API, authenticated as a single fixed
 * sender (andrypiscioneri@gmail.com in production) using a long-lived
 * OAuth2 refresh token obtained once through Google's consent screen —
 * see docs/EMAIL.md for how that token is generated. This is a distinct
 * OAuth2 client/flow from the user-login "Continue with Google" button in
 * server/api/auth/google.get.ts: that one is per-user and only requests
 * `email profile`; this one is app-level and requires the `gmail.send`
 * scope, so it cannot reuse the same nuxt-auth-utils-managed client.
 */
export class GmailEmailProvider implements EmailProvider {
  readonly name = 'gmail'

  private readonly senderEmail: string
  private readonly oauth2Client: InstanceType<typeof google.auth.OAuth2>

  constructor(config: GmailProviderConfig) {
    this.senderEmail = config.senderEmail
    this.oauth2Client = new google.auth.OAuth2(config.clientId, config.clientSecret)
    this.oauth2Client.setCredentials({ refresh_token: config.refreshToken })
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    // Attachment fetching happens once, outside the retry loop below: a
    // dead attachment URL or an oversized file will fail identically on
    // every retry, so there's nothing to gain from re-attempting it — only
    // the actual Gmail API call gets the retry treatment.
    let raw: string
    try {
      raw = toBase64Url(await buildMimeMessage(this.senderEmail, input))
    } catch (error) {
      logger.error('gmail send failed building message (attachment fetch?)', { to: input.to }, error)
      return { success: false, providerId: this.name, providerMessageId: '' }
    }

    let lastError: unknown
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })
        return {
          success: true,
          providerId: this.name,
          providerMessageId: response.data.id ?? `gmail-${Date.now()}`,
        }
      } catch (error) {
        lastError = error
        if (attempt < MAX_ATTEMPTS && isRetryable(error)) {
          await wait(RETRY_DELAY_MS * attempt)
          continue
        }
        break
      }
    }

    // Send failures must not throw — every caller (password reset,
    // registration, campaigns, automations) awaits this without a
    // try/catch, on the deliberate principle that a mail-provider hiccup
    // should never block the underlying action (see the comment in
    // server/api/auth/register.post.ts). Failures still land in the
    // server log for operators to notice.
    logger.error('gmail send failed after max attempts', { to: input.to, attempts: MAX_ATTEMPTS }, lastError)
    return {
      success: false,
      providerId: this.name,
      providerMessageId: '',
    }
  }
}
