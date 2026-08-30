import { z } from 'zod'

export const pushTokenInputSchema = z.object({
  token: z.string().trim().min(1, 'validation.required'),
  platform: z.enum(['ios', 'android']),
})

export type PushTokenInputSchema = z.infer<typeof pushTokenInputSchema>

export const notificationPreferencesSchema = z.object({
  messages: z.boolean(),
  urgentTasks: z.boolean(),
  appointments: z.boolean(),
  reminders: z.boolean(),
  aiActions: z.boolean(),
  approvals: z.boolean(),
  tickets: z.boolean(),
  deadlines: z.boolean(),
})

export type NotificationPreferencesSchema = z.infer<typeof notificationPreferencesSchema>

export const markNotificationSchema = z.object({
  read: z.boolean(),
})

export type MarkNotificationSchema = z.infer<typeof markNotificationSchema>
