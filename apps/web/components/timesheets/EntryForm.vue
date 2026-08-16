<script setup lang="ts">
import type { TimesheetEntry, TimesheetEntryInput } from '~/shared/types/timesheet'
import { timesheetEntryInputSchema } from '~/shared/validation/timesheet'

const props = defineProps<{ entry?: TimesheetEntry | null; prefill?: Partial<TimesheetEntryInput> }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createEntry, updateEntry, removeEntry } = useTimesheets()
const { projects, fetchProjects } = useProjects()
const { tasks, fetchTasks } = useTasks()
const { t } = useI18n()

await Promise.all([!projects.value.length && fetchProjects(), !tasks.value.length && fetchTasks()])

const isEdit = computed(() => !!props.entry)

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const form = reactive<TimesheetEntryInput>({
  projectId: props.entry?.projectId ?? props.prefill?.projectId ?? null,
  taskId: props.entry?.taskId ?? null,
  description: props.entry?.description ?? props.prefill?.description ?? '',
  date: props.entry?.date ?? todayIso(),
  durationMinutes: props.entry?.durationMinutes ?? props.prefill?.durationMinutes ?? 30,
  billable: props.entry?.billable ?? true,
})

const projectTasks = computed(() => tasks.value.filter((t) => !form.projectId || t.projectId === form.projectId))

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  saveError.value = ''

  const result = timesheetEntryInputSchema.safeParse(form)
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
    saveError.value = t('timesheets.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.entry) return
  if (!confirm(t('timesheets.deleteConfirm'))) return
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
      aria-labelledby="entry-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="entry-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('timesheets.form.editTitle') : $t('timesheets.form.newTitle') }}
          </h2>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="entry-projectId" class="block text-label text-ink-400 mb-2">{{ $t('timesheets.form.project') }}</label>
              <select id="entry-projectId" v-model="form.projectId" class="vora-input">
                <option :value="null">{{ $t('timesheets.form.noProject') }}</option>
                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label for="entry-taskId" class="block text-label text-ink-400 mb-2">{{ $t('timesheets.form.task') }}</label>
              <select id="entry-taskId" v-model="form.taskId" class="vora-input">
                <option :value="null">{{ $t('timesheets.form.noTask') }}</option>
                <option v-for="tk in projectTasks" :key="tk.id" :value="tk.id">{{ tk.title }}</option>
              </select>
            </div>
            <div>
              <label for="entry-date" class="block text-label text-ink-400 mb-2">{{ $t('timesheets.form.date') }}</label>
              <input id="entry-date" v-model="form.date" type="date" class="vora-input" />
            </div>
            <div>
              <label for="entry-durationMinutes" class="block text-label text-ink-400 mb-2">{{ $t('timesheets.form.duration') }}</label>
              <input id="entry-durationMinutes" v-model.number="form.durationMinutes" type="number" min="1" max="1440" class="vora-input" :class="{ 'border-danger': errors.durationMinutes }" />
              <p v-if="errors.durationMinutes" class="text-caption text-danger mt-1">{{ errors.durationMinutes }}</p>
            </div>
          </div>

          <div>
            <label for="entry-description" class="block text-label text-ink-400 mb-2">{{ $t('timesheets.form.description') }}</label>
            <textarea id="entry-description" v-model="form.description" rows="2" class="vora-input resize-none" />
          </div>

          <label class="flex items-center gap-2 text-body-sm">
            <input v-model="form.billable" type="checkbox" class="size-4 rounded accent-primary" />
            {{ $t('timesheets.form.billable') }}
          </label>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('timesheets.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('timesheets.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('timesheets.form.saving') : $t('timesheets.form.save') }}
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
