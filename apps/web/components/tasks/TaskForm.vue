<script setup lang="ts">
import type { Task, TaskInput } from '~/shared/types/task'
import { taskInputSchema } from '~/shared/validation/task'

const props = defineProps<{ task?: Task | null; defaultStatus?: Task['status'] }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createTask, updateTask, removeTask, addAttachment } = useTasks()
const { projects, fetchProjects } = useProjects()
const { t, locale } = useI18n()

if (!projects.value.length) await fetchProjects()

const isEdit = computed(() => !!props.task)

const form = reactive<TaskInput>({
  title: props.task?.title ?? '',
  description: props.task?.description ?? '',
  priority: props.task?.priority ?? 'medium',
  status: props.task?.status ?? props.defaultStatus ?? 'todo',
  deadline: props.task?.deadline ?? null,
  tags: props.task?.tags ?? [],
  checklist: props.task?.checklist ?? [],
  contactId: props.task?.contactId ?? null,
  projectId: props.task?.projectId ?? null,
  attachments: props.task?.attachments ?? [],
})

const attachments = ref(props.task?.attachments ?? [])
const newAttachmentTitle = ref('')
const newAttachmentUrl = ref('')
const addingAttachment = ref(false)
const attachmentError = ref('')

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function onAddAttachment() {
  attachmentError.value = ''
  if (!newAttachmentTitle.value.trim() || !newAttachmentUrl.value.trim() || !props.task) return
  addingAttachment.value = true
  try {
    const updated = await addAttachment(props.task.id, newAttachmentTitle.value.trim(), newAttachmentUrl.value.trim())
    attachments.value = updated.attachments
    newAttachmentTitle.value = ''
    newAttachmentUrl.value = ''
  } catch {
    attachmentError.value = t('tasks.attachments.error')
  } finally {
    addingAttachment.value = false
  }
}

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

const prioritizing = ref(false)
const prioritizeExplanation = ref('')

async function onPrioritize() {
  const text = `${form.title} ${form.description}`.trim()
  if (!text) return
  prioritizing.value = true
  try {
    const res = await $fetch<{ priority: TaskInput['priority']; explanation: string }>('/api/ai/classify', {
      method: 'POST',
      body: { text },
    })
    form.priority = res.priority
    prioritizeExplanation.value = res.explanation
  } finally {
    prioritizing.value = false
  }
}

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = taskInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.task) {
      await updateTask(props.task.id, result.data)
    } else {
      await createTask(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('tasks.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.task) return
  if (!confirm(t('tasks.deleteConfirm'))) return
  await removeTask(props.task.id)
  emit('deleted')
}

const dialogRef = ref<HTMLElement | null>(null)
onMounted(() => dialogRef.value?.focus())
</script>

<template>
  <Teleport to="body">
    <div
      ref="dialogRef"
      class="fixed inset-0 z-50 flex items-end tablet:items-center justify-center bg-ink-950/40 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="task-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('tasks.form.editTitle') : $t('tasks.form.newTitle') }}
          </h2>

          <div>
            <label for="task-title" class="block text-label text-ink-400 mb-2">{{ $t('tasks.form.title') }}</label>
            <input id="task-title" v-model="form.title" type="text" class="vora-input" :class="{ 'border-danger': errors.title }" autofocus >
            <p v-if="errors.title" class="text-caption text-danger mt-1">{{ errors.title }}</p>
          </div>

          <div>
            <label for="task-description" class="block text-label text-ink-400 mb-2">{{ $t('tasks.form.description') }}</label>
            <textarea id="task-description" v-model="form.description" rows="3" class="vora-input resize-none" />
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-3 gap-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="task-priority" class="block text-label text-ink-400">{{ $t('tasks.form.priority') }}</label>
                <button
                  type="button"
                  :disabled="prioritizing || !form.title.trim()"
                  class="text-caption text-primary-600 dark:text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                  @click="onPrioritize"
                >
                  {{ prioritizing ? $t('ai.actions.working') : $t('ai.prioritize.action') }}
                </button>
              </div>
              <select id="task-priority" v-model="form.priority" class="vora-input">
                <option v-for="p in ['low', 'medium', 'high', 'urgent']" :key="p" :value="p">{{ $t(`tasks.priority.${p}`) }}</option>
              </select>
              <p v-if="prioritizeExplanation" class="text-caption text-ink-400 mt-1">{{ prioritizeExplanation }}</p>
            </div>
            <div>
              <label for="task-status" class="block text-label text-ink-400 mb-2">{{ $t('tasks.form.status') }}</label>
              <select id="task-status" v-model="form.status" class="vora-input">
                <option v-for="s in ['todo', 'in_progress', 'review', 'completed', 'archived']" :key="s" :value="s">
                  {{ $t(`tasks.status.${s}`) }}
                </option>
              </select>
            </div>
            <div>
              <label for="task-deadline" class="block text-label text-ink-400 mb-2">{{ $t('tasks.form.deadline') }}</label>
              <input id="task-deadline" v-model="form.deadline" type="date" class="vora-input" >
            </div>
          </div>

          <div>
            <label for="task-projectId" class="block text-label text-ink-400 mb-2">{{ $t('tasks.form.project') }}</label>
            <select id="task-projectId" v-model="form.projectId" class="vora-input">
              <option :value="null">{{ $t('tasks.form.noProject') }}</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div v-if="isEdit" class="space-y-3 border-t border-ink-100 dark:border-white/10 pt-4">
            <h3 class="text-label text-ink-400">{{ $t('tasks.attachments.title') }}</h3>
            <p v-if="attachments.length === 0" class="text-body-sm text-ink-400">{{ $t('tasks.attachments.empty') }}</p>
            <ul v-else class="space-y-2">
              <li v-for="a in attachments" :key="a.id" class="flex items-center justify-between gap-3 rounded-md border border-ink-100 dark:border-white/10 p-3">
                <a :href="a.url" target="_blank" rel="noopener noreferrer" class="text-body-sm font-medium text-primary-600 dark:text-primary hover:underline truncate">
                  {{ a.title }}
                </a>
                <span class="text-caption text-ink-400 shrink-0">{{ formatDate(a.addedAt) }}</span>
              </li>
            </ul>

            <div class="flex flex-col tablet:flex-row items-start gap-2">
              <div class="flex-1 w-full">
                <label for="task-attachment-title" class="sr-only">{{ $t('tasks.attachments.titleLabel') }}</label>
                <input
                  id="task-attachment-title"
                  v-model="newAttachmentTitle"
                  type="text"
                  :placeholder="$t('tasks.attachments.titleLabel')"
                  class="vora-input"
                >
              </div>
              <div class="flex-1 w-full">
                <label for="task-attachment-url" class="sr-only">{{ $t('tasks.attachments.urlLabel') }}</label>
                <input
                  id="task-attachment-url"
                  v-model="newAttachmentUrl"
                  type="url"
                  :placeholder="$t('tasks.attachments.urlLabel')"
                  class="vora-input"
                >
              </div>
              <button
                type="button"
                :disabled="addingAttachment || !newAttachmentTitle.trim() || !newAttachmentUrl.trim()"
                class="shrink-0 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
                @click="onAddAttachment"
              >
                {{ $t('tasks.attachments.add') }}
              </button>
            </div>
            <p v-if="attachmentError" class="text-caption text-danger">{{ attachmentError }}</p>
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('tasks.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('tasks.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('tasks.form.saving') : $t('tasks.form.save') }}
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
