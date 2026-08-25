<script setup lang="ts">
import type { LeaveRequestInput } from '~/shared/types/leave'
import { leaveRequestInputSchema } from '~/shared/validation/leave'

const emit = defineEmits<{ close: []; saved: [] }>()

const { createRequest } = useLeaveRequests()
const { employees, fetchEmployees } = useEmployees()
const { t } = useI18n()

if (!employees.value.length) await fetchEmployees()

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const selectedEmployeeId = ref<string | null>(null)

const form = reactive<LeaveRequestInput>({
  requesterName: '',
  type: 'vacation',
  startDate: todayIso(),
  endDate: todayIso(),
  status: 'pending',
  notes: '',
})

watch(selectedEmployeeId, (id) => {
  const emp = employees.value.find((e) => e.id === id)
  form.requesterName = emp ? `${emp.firstName} ${emp.lastName}` : ''
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = leaveRequestInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    await createRequest(result.data)
    emit('saved')
  } catch {
    saveError.value = t('leave.errors.save')
  } finally {
    saving.value = false
  }
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
      aria-labelledby="leave-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="leave-form-title" class="text-h3 font-semibold">{{ $t('leave.form.newTitle') }}</h2>

          <div>
            <label for="leave-requesterName" class="block text-label text-ink-400 mb-2">{{ $t('leave.form.requesterName') }}</label>
            <select v-if="employees.length" id="leave-requesterName" v-model="selectedEmployeeId" class="vora-input" :class="{ 'border-danger': errors.requesterName }">
              <option :value="null" disabled>{{ $t('leave.form.selectEmployee') }}</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.firstName }} {{ emp.lastName }}</option>
            </select>
            <input v-else id="leave-requesterName" v-model="form.requesterName" type="text" class="vora-input" :class="{ 'border-danger': errors.requesterName }" autofocus >
            <p v-if="errors.requesterName" class="text-caption text-danger mt-1">{{ errors.requesterName }}</p>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-3 gap-4">
            <div>
              <label for="leave-type" class="block text-label text-ink-400 mb-2">{{ $t('leave.form.type') }}</label>
              <select id="leave-type" v-model="form.type" class="vora-input">
                <option v-for="leaveType in ['vacation', 'sick', 'personal']" :key="leaveType" :value="leaveType">{{ $t(`leave.type.${leaveType}`) }}</option>
              </select>
            </div>
            <div>
              <label for="leave-startDate" class="block text-label text-ink-400 mb-2">{{ $t('leave.form.startDate') }}</label>
              <input id="leave-startDate" v-model="form.startDate" type="date" class="vora-input" >
            </div>
            <div>
              <label for="leave-endDate" class="block text-label text-ink-400 mb-2">{{ $t('leave.form.endDate') }}</label>
              <input id="leave-endDate" v-model="form.endDate" type="date" class="vora-input" :class="{ 'border-danger': errors.endDate }" >
              <p v-if="errors.endDate" class="text-caption text-danger mt-1">{{ errors.endDate }}</p>
            </div>
          </div>

          <div>
            <label for="leave-notes" class="block text-label text-ink-400 mb-2">{{ $t('leave.form.notes') }}</label>
            <textarea id="leave-notes" v-model="form.notes" rows="2" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
              {{ $t('leave.form.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {{ saving ? $t('leave.form.saving') : $t('leave.form.save') }}
            </button>
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
