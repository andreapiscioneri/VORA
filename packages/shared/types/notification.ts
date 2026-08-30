export interface PushToken {
  id: string
  userId: string
  token: string
  platform: 'ios' | 'android'
  createdAt: string
}

export type PushTokenInput = Pick<PushToken, 'token' | 'platform'>

// One flag per §42 category (messages, urgent tasks, appointments, reminders,
// AI actions, approvals, tickets, deadlines) — the user controls each independently.
export interface NotificationPreferences {
  messages: boolean
  urgentTasks: boolean
  appointments: boolean
  reminders: boolean
  aiActions: boolean
  approvals: boolean
  tickets: boolean
  deadlines: boolean
}

export type NotificationCategory = keyof NotificationPreferences

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  messages: true,
  urgentTasks: true,
  appointments: true,
  reminders: true,
  aiActions: true,
  approvals: true,
  tickets: true,
  deadlines: true,
}

// In-app inbox item — written alongside (not instead of) a push send, so the
// bell/badge in the app reflects the same events even on a device that never
// registered for push (e.g. a sideloaded build with no push entitlement).
export interface AppNotification {
  id: string
  userId: string
  category: NotificationCategory
  title: string
  body: string
  data: Record<string, unknown>
  read: boolean
  createdAt: string
}
