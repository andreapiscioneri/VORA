export const AUTOMATION_TRIGGER_TYPES = ['contact_created', 'contact_status_changed', 'manual'] as const
export type AutomationTriggerType = (typeof AUTOMATION_TRIGGER_TYPES)[number]

export const AUTOMATION_CONDITION_FIELDS = ['status', 'tag', 'source'] as const
export type AutomationConditionField = (typeof AUTOMATION_CONDITION_FIELDS)[number]

export const AUTOMATION_CONDITION_OPERATORS = ['equals', 'not_equals', 'contains'] as const
export type AutomationConditionOperator = (typeof AUTOMATION_CONDITION_OPERATORS)[number]

export const AUTOMATION_ACTION_TYPES = ['send_email', 'add_tag', 'change_status', 'create_task'] as const
export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number]

export interface AutomationTrigger {
  type: AutomationTriggerType
}

export interface AutomationConditionStep {
  kind: 'condition'
  id: string
  field: AutomationConditionField
  operator: AutomationConditionOperator
  value: string
}

export interface AutomationActionStep {
  kind: 'action'
  id: string
  type: AutomationActionType
  // Interpreted per action type: send_email -> { subject, body }; add_tag ->
  // { tag }; change_status -> { status }; create_task -> { title }.
  config: Record<string, string>
}

export interface AutomationDelayStep {
  kind: 'delay'
  id: string
  hours: number
}

export type AutomationStep = AutomationConditionStep | AutomationActionStep | AutomationDelayStep

export interface Automation {
  id: string
  name: string
  active: boolean
  trigger: AutomationTrigger
  steps: AutomationStep[]
  runCount: number
  lastRunAt: string | null
  createdAt: string
  updatedAt: string
}

export type AutomationInput = Omit<Automation, 'id' | 'runCount' | 'lastRunAt' | 'createdAt' | 'updatedAt'>

export interface AutomationRunResult {
  ran: boolean
  actionsExecuted: number
  reason?: 'inactive' | 'condition_not_met'
}
