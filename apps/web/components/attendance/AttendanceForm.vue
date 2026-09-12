<script setup lang="ts">
import type { AttendanceEntry, AttendanceEntryInput } from '~/shared/types/attendance'
import { attendanceEntryInputSchema } from '~/shared/validation/attendance'

const props = defineProps<{ entry?: AttendanceEntry | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createEntry, updateEntry, removeEntry } = useAttendance()
const { employees, fetchEmployees } = useEmployees()
const { t } = useI18n()

if (!employees.value.length) await fetchEmployees()

const isEdit = computed(() => !!props.entry)

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const selectedEmployeeId = ref<string | null>(props.entry?.employeeId ?? null)

const form = reactive<AttendanceEntryInput>({
  employeeId: props.entry?.employeeId ?? null,
  employeeName: props.entry?.employeeName ?? '',
  date: props.entry?.date ?? todayIso(),
  checkIn: props.entry?.checkIn ?? '',
  checkOut: props.entry?.checkOut ?? '',
  notes: props.entry?.notes ?? '',
})

watch(selectedEmployeeId, (id) => {
  form.employeeId = id
  const emp = employees.value.find((e) => e.id === id)
  form.employeeName = emp ? `${emp.firstName} ${emp.lastName}` : ''
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = attendanceEntryInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.entry) {
      await updateEntry(props.entry.id, result.data)
    } else {
      await createEntry(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('attendance.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.entry) return
  if (!confirm(t('attendance.deleteConfirm'))) return
  await removeEntry(props.entry.id)
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
      aria-labelledby="attendance-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="attendance-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('attendance.form.editTitle') : $t('attendance.form.newTitle') }}
          </h2>

          <div>
            <label for="attendance-employee" class="block text-label text-ink-400 mb-2">{{ $t('attendance.form.employeeName') }}</label>
            <select v-if="employees.length" id="attendance-employee" v-model="selectedEmployeeId" class="vora-input" :class="{ 'border-danger': errors.employeeName }">
              <option :value="null" disabled>{{ $t('attendance.form.selectEmployee') }}</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.firstName }} {{ emp.lastName }}</option>
            </select>
            <input v-else id="attendance-employee" v-model="form.employeeName" type="text" class="vora-input" :class="{ 'border-danger': errors.employeeName }" autofocus >
            <p v-if="errors.employeeName" class="text-caption text-danger mt-1">{{ errors.employeeName }}</p>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-3 gap-4">
            <div>
              <label for="attendance-date" class="block text-label text-ink-400 mb-2">{{ $t('attendance.form.date') }}</label>
              <input id="attendance-date" v-model="form.date" type="date" class="vora-input" >
            </div>
            <div>
              <label for="attendance-checkIn" class="block text-label text-ink-400 mb-2">{{ $t('attendance.form.checkIn') }}</label>
              <input id="attendance-checkIn" v-model="form.checkIn" type="time" class="vora-input" :class="{ 'border-danger': errors.checkIn }" >
              <p v-if="errors.checkIn" class="text-caption text-danger mt-1">{{ errors.checkIn }}</p>
            </div>
            <div>
              <label for="attendance-checkOut" class="block text-label text-ink-400 mb-2">{{ $t('attendance.form.checkOut') }}</label>
              <input id="attendance-checkOut" v-model="form.checkOut" type="time" class="vora-input" >
            </div>
          </div>

          <div>
            <label for="attendance-notes" class="block text-label text-ink-400 mb-2">{{ $t('attendance.form.notes') }}</label>
            <textarea id="attendance-notes" v-model="form.notes" rows="2" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('attendance.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('attendance.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('attendance.form.saving') : $t('attendance.form.save') }}
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
