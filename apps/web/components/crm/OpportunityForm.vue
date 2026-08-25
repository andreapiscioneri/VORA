<script setup lang="ts">
import type { Opportunity, OpportunityInput } from '~/shared/types/opportunity'
import { opportunityInputSchema } from '~/shared/validation/opportunity'

const props = defineProps<{ opportunity?: Opportunity | null; defaultStage?: Opportunity['stage'] }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createOpportunity, updateOpportunity, removeOpportunity } = useOpportunities()
const { contacts, fetchContacts } = useContacts()
const { t } = useI18n()

if (!contacts.value.length) await fetchContacts()

const isEdit = computed(() => !!props.opportunity)

const form = reactive<OpportunityInput>({
  title: props.opportunity?.title ?? '',
  contactId: props.opportunity?.contactId ?? null,
  company: props.opportunity?.company ?? '',
  value: props.opportunity?.value ?? 0,
  currency: props.opportunity?.currency ?? 'EUR',
  probability: props.opportunity?.probability ?? 50,
  stage: props.opportunity?.stage ?? props.defaultStage ?? 'lead',
  source: props.opportunity?.source ?? 'manual',
  notes: props.opportunity?.notes ?? '',
  expectedCloseDate: props.opportunity?.expectedCloseDate ?? null,
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = opportunityInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.opportunity) {
      await updateOpportunity(props.opportunity.id, result.data)
    } else {
      await createOpportunity(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('crm.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.opportunity) return
  if (!confirm(t('crm.deleteConfirm'))) return
  await removeOpportunity(props.opportunity.id)
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
      aria-labelledby="opportunity-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="opportunity-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('crm.form.editTitle') : $t('crm.form.newTitle') }}
          </h2>

          <div>
            <label for="opportunity-title" class="block text-label text-ink-400 mb-2">{{ $t('crm.form.title') }}</label>
            <input id="opportunity-title" v-model="form.title" type="text" class="vora-input" :class="{ 'border-danger': errors.title }" autofocus >
            <p v-if="errors.title" class="text-caption text-danger mt-1">{{ errors.title }}</p>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="opportunity-contactId" class="block text-label text-ink-400 mb-2">{{ $t('crm.form.contact') }}</label>
              <select id="opportunity-contactId" v-model="form.contactId" class="vora-input">
                <option :value="null">{{ $t('crm.form.noContact') }}</option>
                <option v-for="c in contacts" :key="c.id" :value="c.id">{{ c.firstName }} {{ c.lastName }}</option>
              </select>
            </div>
            <div>
              <label for="opportunity-company" class="block text-label text-ink-400 mb-2">{{ $t('crm.form.company') }}</label>
              <input id="opportunity-company" v-model="form.company" type="text" class="vora-input" >
            </div>
            <div>
              <label for="opportunity-value" class="block text-label text-ink-400 mb-2">{{ $t('crm.form.value') }} (EUR)</label>
              <input id="opportunity-value" v-model.number="form.value" type="number" min="0" step="100" class="vora-input" >
            </div>
            <div>
              <label for="opportunity-probability" class="block text-label text-ink-400 mb-2">{{ $t('crm.form.probability') }} (%)</label>
              <input id="opportunity-probability" v-model.number="form.probability" type="number" min="0" max="100" step="5" class="vora-input" >
            </div>
            <div>
              <label for="opportunity-stage" class="block text-label text-ink-400 mb-2">{{ $t('crm.form.stage') }}</label>
              <select id="opportunity-stage" v-model="form.stage" class="vora-input">
                <option v-for="s in ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']" :key="s" :value="s">
                  {{ $t(`crm.stage.${s}`) }}
                </option>
              </select>
            </div>
            <div>
              <label for="opportunity-expectedCloseDate" class="block text-label text-ink-400 mb-2">{{ $t('crm.form.expectedCloseDate') }}</label>
              <input id="opportunity-expectedCloseDate" v-model="form.expectedCloseDate" type="date" class="vora-input" >
            </div>
          </div>

          <div>
            <label for="opportunity-notes" class="block text-label text-ink-400 mb-2">{{ $t('crm.form.notes') }}</label>
            <textarea id="opportunity-notes" v-model="form.notes" rows="3" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('crm.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('crm.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('crm.form.saving') : $t('crm.form.save') }}
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
  @apply w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body outline-none focus:border-primary transition-colors;
}
</style>
