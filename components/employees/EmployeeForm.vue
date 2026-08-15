<script setup lang="ts">
import type { Employee, EmployeeInput } from '~/shared/types/employee'
import { employeeInputSchema } from '~/shared/validation/employee'

const props = defineProps<{ employee?: Employee | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createEmployee, updateEmployee, removeEmployee } = useEmployees()
const { t } = useI18n()

const isEdit = computed(() => !!props.employee)

const form = reactive<EmployeeInput>({
  firstName: props.employee?.firstName ?? '',
  lastName: props.employee?.lastName ?? '',
  email: props.employee?.email ?? '',
  role: props.employee?.role ?? '',
  team: props.employee?.team ?? '',
  status: props.employee?.status ?? 'active',
  startDate: props.employee?.startDate ?? null,
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  saveError.value = ''

  const result = employeeInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.employee) {
      await updateEmployee(props.employee.id, result.data)
    } else {
      await createEmployee(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('employees.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.employee) return
  if (!confirm(t('employees.deleteConfirm'))) return
  await removeEmployee(props.employee.id)
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
      aria-labelledby="employee-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="employee-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('employees.form.editTitle') : $t('employees.form.newTitle') }}
          </h2>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="employee-firstName" class="block text-label text-ink-400 mb-2">{{ $t('employees.form.firstName') }}</label>
              <input id="employee-firstName" v-model="form.firstName" type="text" class="vora-input" :class="{ 'border-danger': errors.firstName }" autofocus />
              <p v-if="errors.firstName" class="text-caption text-danger mt-1">{{ errors.firstName }}</p>
            </div>
            <div>
              <label for="employee-lastName" class="block text-label text-ink-400 mb-2">{{ $t('employees.form.lastName') }}</label>
              <input id="employee-lastName" v-model="form.lastName" type="text" class="vora-input" :class="{ 'border-danger': errors.lastName }" />
              <p v-if="errors.lastName" class="text-caption text-danger mt-1">{{ errors.lastName }}</p>
            </div>
            <div>
              <label for="employee-email" class="block text-label text-ink-400 mb-2">{{ $t('employees.form.email') }}</label>
              <input id="employee-email" v-model="form.email" type="email" class="vora-input" :class="{ 'border-danger': errors.email }" />
              <p v-if="errors.email" class="text-caption text-danger mt-1">{{ errors.email }}</p>
            </div>
            <div>
              <label for="employee-role" class="block text-label text-ink-400 mb-2">{{ $t('employees.form.role') }}</label>
              <input id="employee-role" v-model="form.role" type="text" class="vora-input" />
            </div>
            <div>
              <label for="employee-team" class="block text-label text-ink-400 mb-2">{{ $t('employees.form.team') }}</label>
              <input id="employee-team" v-model="form.team" type="text" class="vora-input" />
            </div>
            <div>
              <label for="employee-status" class="block text-label text-ink-400 mb-2">{{ $t('employees.form.status') }}</label>
              <select id="employee-status" v-model="form.status" class="vora-input">
                <option value="active">{{ $t('employees.status.active') }}</option>
                <option value="inactive">{{ $t('employees.status.inactive') }}</option>
              </select>
            </div>
            <div>
              <label for="employee-startDate" class="block text-label text-ink-400 mb-2">{{ $t('employees.form.startDate') }}</label>
              <input id="employee-startDate" v-model="form.startDate" type="date" class="vora-input" />
            </div>
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('employees.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('employees.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('employees.form.saving') : $t('employees.form.save') }}
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
