import { communicationInputSchema } from '~/shared/validation/communication'
import { createCommunication } from '~/server/utils/communications'
import { requireOrgId, listOrganizationMemberUserIds } from '~/server/utils/auth'
import { sendPushToUser } from '~/server/services/notifications'

// Records a communication directly (inbound receipt or manual log entry).
// For sending a new outbound message through a provider, use
// POST /api/communications/send instead.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = communicationInputSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  }

  const organizationId = await requireOrgId(event)
  const communication = await createCommunication(result.data, organizationId)

  // Inbound messages are the one case a mobile user genuinely needs to know
  // about in real time; outbound/manual log entries were just created by
  // someone in the app, who doesn't need a push about their own action.
  if (communication.direction === 'inbound') {
    const memberIds = await listOrganizationMemberUserIds(organizationId)
    await Promise.all(
      memberIds.map((userId) =>
        sendPushToUser(userId, 'messages', {
          title: 'Nuovo messaggio',
          body: communication.subject || communication.body.slice(0, 120),
          data: { type: 'communication', id: communication.id },
        })
      )
    )
  }

  return communication
})
