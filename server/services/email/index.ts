import type { EmailProvider } from './types'
import { MockEmailProvider } from './mock'

let provider: EmailProvider | null = null

/**
 * Returns the configured EmailProvider. Falls back to MockEmailProvider
 * when no real provider credentials are set — the rest of the app is
 * written against the EmailProvider interface, so plugging in a real
 * Gmail/Microsoft/IMAP implementation later requires no other changes.
 */
export function getEmailProvider(): EmailProvider {
  if (provider) return provider

  // No EMAIL_PROVIDER_API_KEY / OAuth credentials configured yet — see .env.example.
  provider = new MockEmailProvider()
  return provider
}
