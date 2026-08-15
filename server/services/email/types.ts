export interface SendEmailInput {
  to: string
  subject: string
  body: string
}

export interface SendEmailResult {
  success: boolean
  providerId: string
  providerMessageId: string
}

/**
 * Abstraction over the actual email transport, so the rest of the app never
 * talks to Gmail/Microsoft/IMAP directly. Swap the implementation returned
 * by getEmailProvider() once real credentials exist — nothing else changes.
 */
export interface EmailProvider {
  readonly name: string
  send(input: SendEmailInput): Promise<SendEmailResult>
}
