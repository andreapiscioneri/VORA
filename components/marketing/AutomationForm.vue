<script setup lang="ts">
import type { Automation, AutomationInput, AutomationStep, AutomationTriggerType, AutomationConditionField, AutomationConditionOperator, AutomationActionType } from '~/shared/types/automation'
import { AUTOMATION_TRIGGER_TYPES, AUTOMATION_CONDITION_FIELDS, AUTOMATION_CONDITION_OPERATORS, AUTOMATION_ACTION_TYPES } from '~/shared/types/automation'
import { automationInputSchema } from '~/shared/validation/automation'

const props = defineProps<{ automation?: Automation | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createAutomation, updateAutomation, removeAutomation } = useAutomations()
const { t } = useI18n()

const isEdit = computed(() => !!props.automation)

const name = ref(props.automation?.name ?? '')
const active = ref(props.automation?.active ?? true)
const triggerType = ref<AutomationTriggerType>(props.automation?.trigger.type ?? 'contact_created')
const steps = ref<AutomationStep[]>(props.automation ? structuredClone(toRaw(props.automation.steps)) : [])

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

function addCondition() {
  steps.value.push({ kind: 'condition', id: crypto.randomUUID(), field: 'status', operator: 'equals', value: '' })
}
function addAction() {
  steps.value.push({ kind: 'action', id: crypto.randomUUID(), type: 'add_tag', config: {} })
}
function addDelay() {
  steps.value.push({ kind: 'delay', id: crypto.randomUUID(), hours: 1 })
}
function removeStep(id: string) {
  steps.value = steps.value.filter((s) => s.id !== id)
}
function moveStep(index: number, dir: -1 | 1) {
  const target = index + dir
  if (target < 0 || target >= steps.value.length) return
  const arr = [...steps.value]
  ;[arr[index], arr[target]] = [arr[target], arr[index]]
  steps.value = arr
}

function buildInput(): AutomationInput {
  return {
    name: name.value,
    active: active.value,
    trigger: { type: triggerType.value },
    steps: steps.value,
  }
}

async function onSubmit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  saveError.value = ''

  const result = automationInputSchema.safeParse(buildInput())
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.automation) {
      await updateAutomation(props.automation.id, result.data)
    } else {
      await createAutomation(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('automations.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.automation) return
  if (!confirm(t('automations.deleteConfirm'))) return
  await removeAutomation(props.automation.id)
  emit('deleted')
}

const dialogRef = ref<HTMLElement | null>(null)
onMounted(() => dialogRef.value?.focus())
</script>

<template>
  <Teleport to="body">
    <div
      ref="dialogRef"
      class="fixed inset-0 z-50 flex items-end tablet:items-center justify-center bg-ink-950/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="automation-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="automation-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('automations.form.editTitle') : $t('automations.form.newTitle') }}
          </h2>

          <div>
            <label for="automation-name" class="block text-label text-ink-400 mb-2">{{ $t('automations.form.name') }}</label>
            <input id="automation-name" v-model="name" type="text" class="vora-input" :class="{ 'border-danger': errors.name }" autofocus />
            <p v-if="errors.name" class="text-caption text-danger mt-1">{{ errors.name }}</p>
          </div>

          <label class="flex items-center gap-2 text-body-sm">
            <input v-model="active" type="checkbox" class="size-4 rounded accent-primary" />
            {{ $t('automations.form.active') }}
          </label>

          <div>
            <label for="automation-trigger" class="block text-label text-ink-400 mb-2">{{ $t('automations.form.trigger') }}</label>
            <select id="automation-trigger" v-model="triggerType" class="vora-input">
              <option v-for="tt in AUTOMATION_TRIGGER_TYPES" :key="tt" :value="tt">{{ $t(`automations.trigger.${tt}`) }}</option>
            </select>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-label text-ink-400">{{ $t('automations.form.steps') }}</span>
              <div class="flex items-center gap-2">
                <button type="button" class="text-caption px-2 py-1 rounded border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5" @click="addCondition">
                  + {{ $t('automations.form.addCondition') }}
                </button>
                <button type="button" class="text-caption px-2 py-1 rounded border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5" @click="addAction">
                  + {{ $t('automations.form.addAction') }}
                </button>
                <button type="button" class="text-caption px-2 py-1 rounded border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5" @click="addDelay">
                  + {{ $t('automations.form.addDelay') }}
                </button>
              </div>
            </div>

            <p v-if="steps.length === 0" class="text-body-sm text-ink-400">{{ $t('automations.form.noSteps') }}</p>

            <div v-for="(step, index) in steps" :key="step.id" class="rounded-md border border-ink-100 dark:border-white/10 p-3 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-caption font-medium uppercase tracking-wide text-ink-400">{{ $t(`automations.form.stepKind.${step.kind}`) }}</span>
                <div class="flex items-center gap-1">
                  <button type="button" class="p-1 text-ink-400 hover:text-ink-900 dark:hover:text-white disabled:opacity-30" :disabled="index === 0" :aria-label="$t('automations.form.moveUp')" @click="moveStep(index, -1)">
                    <UiIcon name="chevron-up" :size="14" />
                  </button>
                  <button type="button" class="p-1 text-ink-400 hover:text-ink-900 dark:hover:text-white disabled:opacity-30" :disabled="index === steps.length - 1" :aria-label="$t('automations.form.moveDown')" @click="moveStep(index, 1)">
                    <UiIcon name="chevron-down" :size="14" />
                  </button>
                  <button type="button" class="p-1 text-ink-400 hover:text-danger" :aria-label="$t('automations.form.removeStep')" @click="removeStep(step.id)">
                    <UiIcon name="trash" :size="14" />
                  </button>
                </div>
              </div>

              <!-- Condition step -->
              <div v-if="step.kind === 'condition'" class="grid grid-cols-3 gap-2">
                <select v-model="step.field as AutomationConditionField" class="vora-input text-body-sm">
                  <option v-for="f in AUTOMATION_CONDITION_FIELDS" :key="f" :value="f">{{ $t(`automations.form.field.${f}`) }}</option>
                </select>
                <select v-model="step.operator as AutomationConditionOperator" class="vora-input text-body-sm">
                  <option v-for="op in AUTOMATION_CONDITION_OPERATORS" :key="op" :value="op">{{ $t(`automations.form.operator.${op}`) }}</option>
                </select>
                <input v-model="step.value" type="text" class="vora-input text-body-sm" :placeholder="$t('automations.form.value')" />
              </div>

              <!-- Action step -->
              <div v-else-if="step.kind === 'action'" class="space-y-2">
                <select v-model="step.type as AutomationActionType" class="vora-input text-body-sm">
                  <option v-for="at in AUTOMATION_ACTION_TYPES" :key="at" :value="at">{{ $t(`automations.form.actionType.${at}`) }}</option>
                </select>
                <template v-if="step.type === 'send_email'">
                  <input v-model="step.config.subject" type="text" class="vora-input text-body-sm" :placeholder="$t('automations.form.emailSubject')" />
                  <textarea v-model="step.config.body" rows="2" class="vora-input text-body-sm" :placeholder="$t('automations.form.emailBody')" />
                </template>
                <input v-else-if="step.type === 'add_tag'" v-model="step.config.tag" type="text" class="vora-input text-body-sm" :placeholder="$t('automations.form.tag')" />
                <input v-else-if="step.type === 'change_status'" v-model="step.config.status" type="text" class="vora-input text-body-sm" :placeholder="$t('automations.form.status')" />
                <input v-else-if="step.type === 'create_task'" v-model="step.config.title" type="text" class="vora-input text-body-sm" :placeholder="$t('automations.form.taskTitle')" />
              </div>

              <!-- Delay step -->
              <div v-else class="space-y-1">
                <label class="flex items-center gap-2 text-body-sm">
                  {{ $t('automations.form.waitHours') }}
                  <input v-model.number="step.hours" type="number" min="0" class="vora-input text-body-sm w-24" />
                </label>
                <p class="text-caption text-warning">{{ $t('automations.form.delayLimitation') }}</p>
              </div>
            </div>
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('automations.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('automations.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('automations.form.saving') : $t('automations.form.save') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.vora-input {
  @apply w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body outline-none focus:border-primary transition-colors disabled:opacity-60;
}
</style>
