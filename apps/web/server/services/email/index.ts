import type { EmailProvider } from './types'
import { MockEmailProvider } from './mock'
import { GmailEmailProvider } from './gmail'

let provider: EmailProvider | null = null

/**
 * Returns the configured EmailProvider. Falls back to MockEmailProvider
 * when no real provider credentials are set — the rest of the app is
 * written against the EmailProvider interface, so plugging in a real
 * Gmail/Microsoft/IMAP implementation later requires no other changes.
 */
export function getEmailProvider(): EmailProvider {
  if (provider) return provider

  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  const senderEmail = process.env.GMAIL_SENDER_EMAIL

  if (clientId && clientSecret && refreshToken && senderEmail) {
    provider = new GmailEmailProvider({ clientId, clientSecret, refreshToken, senderEmail })
    return provider
  }

  // No GMAIL_* credentials configured — see .env.example / docs/EMAIL.md.
  provider = new MockEmailProvider()
  return provider
}
