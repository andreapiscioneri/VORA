import { z } from 'zod'
import {
  AUTOMATION_TRIGGER_TYPES,
  AUTOMATION_CONDITION_FIELDS,
  AUTOMATION_CONDITION_OPERATORS,
  AUTOMATION_ACTION_TYPES,
} from '~/shared/types/automation'

export const automationTriggerSchema = z.object({
  type: z.enum(AUTOMATION_TRIGGER_TYPES),
})

export const automationConditionStepSchema = z.object({
  kind: z.literal('condition'),
  id: z.string().min(1),
  field: z.enum(AUTOMATION_CONDITION_FIELDS),
  operator: z.enum(AUTOMATION_CONDITION_OPERATORS),
  value: z.string().trim().min(1, 'validation.required').max(160),
})

export const automationActionStepSchema = z.object({
  kind: z.literal('action'),
  id: z.string().min(1),
  type: z.enum(AUTOMATION_ACTION_TYPES),
  config: z.record(z.string(), z.string().max(2000)),
})

export const automationDelayStepSchema = z.object({
  kind: z.literal('delay'),
  id: z.string().min(1),
  hours: z.number().min(0).max(24 * 30),
})

export const automationStepSchema = z.discriminatedUnion('kind', [
  automationConditionStepSchema,
  automationActionStepSchema,
  automationDelayStepSchema,
])

export const automationInputSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(160),
  active: z.boolean().default(true),
  trigger: automationTriggerSchema,
  steps: z.array(automationStepSchema).default([]),
})

export type AutomationInputSchema = z.infer<typeof automationInputSchema>
