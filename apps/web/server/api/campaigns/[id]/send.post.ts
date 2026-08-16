import { getEmailProvider } from '~/server/services/email'
import { getCampaign, updateCampaign } from '~/server/utils/campaigns'
import { requireOrgId } from '~/server/utils/auth'

// Sends the campaign through the configured EmailProvider (mock, unless a
// real one is configured — see server/services/email). Per-recipient send
// is out of scope without a real mailing list/segment infrastructure; this
// records a single representative send and marks the campaign as sent.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const organizationId = await requireOrgId(event)
  const campaign = await getCampaign(id, organizationId)

  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
  }

  const result = await getEmailProvider().send({
    to: `${campaign.recipientCount} recipients`,
    subject: campaign.subject,
    body: campaign.body,
  })

  const updated = await updateCampaign(
    id,
    {
      name: campaign.name,
      subject: campaign.subject,
      body: campaign.body,
      recipientCount: campaign.recipientCount,
      status: 'sent',
      sentAt: new Date().toISOString(),
    },
    organizationId,
  )

  return { campaign: updated, provider: result }
})
