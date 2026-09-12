import { z } from 'zod'

export const sendAssistantMessageSchema = z.object({
  content: z.string().trim().min(1, 'validation.required').max(4000),
})

export const renameAssistantConversationSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(120),
})

export const assistantToolConfirmSchema = z.object({
  toolCallId: z.string().min(1),
  approve: z.boolean(),
})

export type SendAssistantMessageSchema = z.infer<typeof sendAssistantMessageSchema>
export type RenameAssistantConversationSchema = z.infer<typeof renameAssistantConversationSchema>
export type AssistantToolConfirmSchema = z.infer<typeof assistantToolConfirmSchema>
