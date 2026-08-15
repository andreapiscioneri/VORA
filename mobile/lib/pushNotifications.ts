import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { api } from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Registers this device for push and tells the backend about the token, so
// server/services/notifications can address it later. Returns null (and
// registers nothing) whenever push genuinely isn't available here — that's
// the normal case on a simulator (no APNs/FCM credentials) or before an EAS
// project id exists (see mobile/app.json — added once `eas build:configure`
// runs), not an error to surface to the user.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    // iOS/Android simulators have no push capability at all; real delivery
    // can only be verified on a physical device.
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#39FF14',
    })
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) return null

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    await api.post('/notifications/register-token', { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' })
    return token
  } catch (e) {
    console.warn('[push] registration failed:', e)
    return null
  }
}
