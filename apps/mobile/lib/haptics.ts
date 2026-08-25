import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

// expo-haptics no-ops on Android when the device has no vibration motor and
// throws on web (no Taptic Engine equivalent) — Platform.OS === 'web' is
// the one case worth guarding explicitly, everything else expo-haptics
// itself handles gracefully.
const supported = Platform.OS !== 'web'

export const haptics = {
  /** Light tap — navigation, tab switches, toggles. */
  tap: () => {
    if (supported) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  },
  /** Slightly stronger tap — primary button presses (submit, save). */
  press: () => {
    if (supported) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  },
  /** A destructive/high-stakes action (delete, reject). */
  warning: () => {
    if (supported) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  },
  /** An action completed successfully (task done, form saved). */
  success: () => {
    if (supported) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  },
  /** An action failed (validation error, request failure). */
  error: () => {
    if (supported) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  },
  /** Moving through a list of discrete options (segmented control, picker). */
  selection: () => {
    if (supported) void Haptics.selectionAsync()
  },
}
