<script setup lang="ts">
import type { PayrollRecord, PayrollRecordInput } from '~/shared/types/payroll'
import { payrollRecordInputSchema } from '~/shared/validation/payroll'
import { PAYROLL_STATUSES } from '~/shared/types/payroll'

const props = defineProps<{ record?: PayrollRecord | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createRecord, updateRecord, removeRecord } = usePayroll()
const { employees, fetchEmployees } = useEmployees()
const { t } = useI18n()

if (!employees.value.length) await fetchEmployees()

const isEdit = computed(() => !!props.record)
const selectedEmployeeName = ref(props.record?.employeeName ?? '')

const form = reactive<PayrollRecordInput>({
  employeeName: props.record?.employeeName ?? '',
  period: props.record?.period ?? '',
  grossAmount: props.record?.grossAmount ?? 0,
  netAmount: props.record?.netAmount ?? 0,
  status: props.record?.status ?? 'draft',
  payslipUrl: props.record?.payslipUrl ?? '',
  paidAt: props.record?.paidAt ?? null,
  notes: props.record?.notes ?? '',
})

watch(selectedEmployeeName, (name) => {
  form.employeeName = name
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = payrollRecordInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.record) {
      await updateRecord(props.record.id, result.data)
    } else {
      await createRecord(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('payroll.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.record) return
  if (!confirm(t('payroll.deleteConfirm'))) return
  await removeRecord(props.record.id)
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
      aria-labelledby="payroll-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="payroll-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('payroll.form.editTitle') : $t('payroll.form.newTitle') }}
          </h2>

          <p class="text-caption text-ink-400">{{ $t('payroll.disclaimer') }}</p>

          <div>
            <label for="payroll-employee" class="block text-label text-ink-400 mb-2">{{ $t('payroll.form.employeeName') }}</label>
            <select v-if="employees.length" id="payroll-employee" v-model="selectedEmployeeName" class="vora-input" :class="{ 'border-danger': errors.employeeName }">
              <option value="" disabled>{{ $t('payroll.form.selectEmployee') }}</option>
              <option v-for="emp in employees" :key="emp.id" :value="`${emp.firstName} ${emp.lastName}`">{{ emp.firstName }} {{ emp.lastName }}</option>
            </select>
            <input v-else id="payroll-employee" v-model="form.employeeName" type="text" class="vora-input" :class="{ 'border-danger': errors.employeeName }" autofocus >
            <p v-if="errors.employeeName" class="text-caption text-danger mt-1">{{ errors.employeeName }}</p>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="payroll-period" class="block text-label text-ink-400 mb-2">{{ $t('payroll.form.period') }}</label>
              <input id="payroll-period" v-model="form.period" type="text" placeholder="YYYY-MM" class="vora-input" :class="{ 'border-danger': errors.period }" >
              <p v-if="errors.period" class="text-caption text-danger mt-1">{{ errors.period }}</p>
            </div>
            <div>
              <label for="payroll-status" class="block text-label text-ink-400 mb-2">{{ $t('payroll.form.status') }}</label>
              <select id="payroll-status" v-model="form.status" class="vora-input">
                <option v-for="s in PAYROLL_STATUSES" :key="s" :value="s">{{ $t(`payroll.status.${s}`) }}</option>
              </select>
            </div>
            <div>
              <label for="payroll-grossAmount" class="block text-label text-ink-400 mb-2">{{ $t('payroll.form.grossAmount') }}</label>
              <input id="payroll-grossAmount" v-model.number="form.grossAmount" type="number" step="0.01" min="0" class="vora-input" >
            </div>
            <div>
              <label for="payroll-netAmount" class="block text-label text-ink-400 mb-2">{{ $t('payroll.form.netAmount') }}</label>
              <input id="payroll-netAmount" v-model.number="form.netAmount" type="number" step="0.01" min="0" class="vora-input" >
            </div>
            <div>
              <label for="payroll-paidAt" class="block text-label text-ink-400 mb-2">{{ $t('payroll.form.paidAt') }}</label>
              <input id="payroll-paidAt" v-model="form.paidAt" type="date" class="vora-input" >
            </div>
          </div>

          <div>
            <label for="payroll-payslipUrl" class="block text-label text-ink-400 mb-2">{{ $t('payroll.form.payslipUrl') }}</label>
            <input id="payroll-payslipUrl" v-model="form.payslipUrl" type="text" placeholder="https://..." class="vora-input" >
          </div>

          <div>
            <label for="payroll-notes" class="block text-label text-ink-400 mb-2">{{ $t('payroll.form.notes') }}</label>
            <textarea id="payroll-notes" v-model="form.notes" rows="2" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('payroll.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('payroll.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('payroll.form.saving') : $t('payroll.form.save') }}
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
