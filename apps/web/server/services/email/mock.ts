import type { EmailProvider, SendEmailInput, SendEmailResult } from './types'
import { logger } from '~/server/utils/logger'

/**
 * No real Gmail/Microsoft/IMAP credentials are configured (see .env.example).
 * This provider does not send anything over the network — it only records
 * the send locally so the rest of the app can be built and demoed honestly.
 * Never presented to the user as a live integration.
 */
export class MockEmailProvider implements EmailProvider {
  readonly name = 'mock'

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    // "Recording locally" means the server console in this mode — the
    // closest honest equivalent to a dev mail-catcher (Mailhog etc.)
    // without running one. This is how you read a verification/reset link
    // in local dev with no real email provider configured.
    logger.info('mock email send', { to: input.to, subject: input.subject, body: input.body, attachments: input.attachments?.map((a) => a.title) })
    return {
      success: true,
      providerId: this.name,
      providerMessageId: `mock-email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }
  }
}
