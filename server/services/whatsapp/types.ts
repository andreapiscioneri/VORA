export interface SendWhatsAppInput {
  to: string
  body: string
}

export interface SendWhatsAppResult {
  success: boolean
  providerId: string
  providerMessageId: string
}

/**
 * Abstraction over the WhatsApp Business Platform (official API only —
 * never WhatsApp Web scraping). Swap the implementation returned by
 * getWhatsAppProvider() once a real Business API account is configured.
 */
export interface WhatsAppProvider {
  readonly name: string
  send(input: SendWhatsAppInput): Promise<SendWhatsAppResult>
}
