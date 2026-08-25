import type { SendWhatsAppInput, SendWhatsAppResult, WhatsAppProvider } from './types'
import { logger } from '~/server/utils/logger'

/**
 * No real WhatsApp Business API credentials are configured (see
 * .env.example: WHATSAPP_API_KEY, WHATSAPP_WEBHOOK_SECRET). This provider
 * records the send locally and never talks to the network. Never presented
 * to the user as a live integration.
 */
export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'mock'

  async send(input: SendWhatsAppInput): Promise<SendWhatsAppResult> {
    // Same "record locally" convention as MockEmailProvider (server/services/email/mock.ts).
    logger.info('mock whatsapp send', { to: input.to, body: input.body })
    return {
      success: true,
      providerId: this.name,
      providerMessageId: `mock-whatsapp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }
  }
}
