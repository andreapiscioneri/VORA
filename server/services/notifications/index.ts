import type { NotificationCategory } from '~/shared/types/notification'
import { getPreferences } from '~/server/utils/notificationPreferences'
import { listTokensForUser } from '~/server/utils/pushTokens'

export interface PushNotification {
  title: string
  body: string
  data?: Record<string, unknown>
}

// Sends via Expo's push notification relay (https://exp.host) — this needs
// no API key or paid Apple/Google developer account for delivery to devices
// running the app in Expo Go or a dev build; Expo operates the relay for
// free at this scale. An optional EXPO_ACCESS_TOKEN raises Expo's own rate
// limits for production volume but isn't required to send at all.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

// Respects the recipient's per-category preference (§42: "users must be able
// to control notification preferences") and silently no-ops if they have no
// registered device — that's the normal case for a user who hasn't opened
// the mobile app yet, not an error.
export async function sendPushToUser(userId: string, category: NotificationCategory, notification: PushNotification): Promise<void> {
  const prefs = await getPreferences(userId)
  if (!prefs[category]) return

  const tokens = await listTokensForUser(userId)
  if (tokens.length === 0) return

  const messages = tokens.map((t) => ({
    to: t.token,
    title: notification.title,
    body: notification.body,
    data: notification.data ?? {},
    sound: 'default' as const,
  }))

  const accessToken = process.env.EXPO_ACCESS_TOKEN
  await $fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: messages,
  }).catch((error) => {
    // A push-delivery failure must never break the request that triggered
    // it (e.g. logging an inbound message) — log and move on.
    console.error('[push] Expo send failed:', error)
  })
}
