// Same shape as ContactAttachment (packages/shared/types/contact.ts): a
// title plus a URL to fetch the file from, not raw bytes — this app has no
// binary upload endpoint, every attachment across Contacts/Tasks/Tickets
// is already a link the user pastes in, so email attachments follow the
// same convention rather than inventing a second one.
export interface EmailAttachment {
  title: string
  url: string
}

export interface SendEmailInput {
  to: string
  subject: string
  body: string
  attachments?: EmailAttachment[]
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
