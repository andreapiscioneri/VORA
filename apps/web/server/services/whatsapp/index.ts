import type { WhatsAppProvider } from './types'
import { MockWhatsAppProvider } from './mock'

let provider: WhatsAppProvider | null = null

/**
 * Returns the configured WhatsAppProvider. Falls back to
 * MockWhatsAppProvider when no WHATSAPP_API_KEY is set — see .env.example.
 */
export function getWhatsAppProvider(): WhatsAppProvider {
  if (provider) return provider

  provider = new MockWhatsAppProvider()
  return provider
}
