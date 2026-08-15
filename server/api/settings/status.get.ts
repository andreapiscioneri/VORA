import { getAIService } from '~/server/services/ai'
import { getEmailProvider } from '~/server/services/email'
import { getWhatsAppProvider } from '~/server/services/whatsapp'
import { requireOrgId } from '~/server/utils/auth'

// Read-only integration status for the Settings page — never exposes
// secrets, only which provider is active (mock vs a real one) so the user
// can see what's genuinely connected versus what's honestly still a stand-in.
export default defineEventHandler(async (event) => {
  await requireOrgId(event)

  return {
    ai: { provider: getAIService().name, live: getAIService().name !== 'heuristic' },
    email: { provider: getEmailProvider().name, live: getEmailProvider().name !== 'mock' },
    whatsapp: { provider: getWhatsAppProvider().name, live: getWhatsAppProvider().name !== 'mock' },
    oauthGoogle: { live: Boolean(process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID && process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET) },
  }
})
