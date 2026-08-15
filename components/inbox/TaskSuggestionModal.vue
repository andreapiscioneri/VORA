<script setup lang="ts">
import type { TaskSuggestion } from '~/shared/types/ai'
import type { Communication } from '~/shared/types/communication'

const props = defineProps<{ communication: Communication }>()
const emit = defineEmits<{ close: []; created: [] }>()

const { createTask } = useTasks()
const { t } = useI18n()

const loading = ref(true)
const suggestion = ref<TaskSuggestion | null>(null)
const loadError = ref('')

const form = reactive({ title: '', deadline: null as string | null, priority: 'medium' as TaskSuggestion['priority'] })
const saving = ref(false)

onMounted(async () => {
  try {
    const res = await $fetch<{ suggestion: TaskSuggestion | null }>('/api/ai/extract-task', {
      method: 'POST',
      body: { text: props.communication.body },
    })
    suggestion.value = res.suggestion
    if (res.suggestion) {
      form.title = res.suggestion.title
      form.deadline = res.suggestion.deadline
      form.priority = res.suggestion.priority
    }
  } catch {
    loadError.value = t('ai.errors.extract')
  } finally {
    loading.value = false
  }
})

async function onConfirm() {
  saving.value = true
  try {
    await createTask({
      title: form.title,
      description: props.communication.body,
      priority: form.priority,
      status: 'todo',
      deadline: form.deadline,
      tags: [],
      checklist: [],
      contactId: props.communication.contactId,
      projectId: null,
      attachments: [],
    })
    emit('created')
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
      aria-labelledby="task-suggestion-modal-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-md rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <div class="p-6 space-y-5">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center size-8 rounded-full bg-primary/15 text-primary-600 dark:text-primary">
              <UiIcon name="check-square" :size="16" />
            </span>
            <h2 id="task-suggestion-modal-title" class="text-h4 font-semibold">{{ $t('ai.taskSuggestion.title') }}</h2>
          </div>

          <div v-if="loading" class="h-20 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />

          <p v-else-if="loadError" class="text-body-sm text-danger">{{ loadError }}</p>

          <p v-else-if="!suggestion" class="text-body-sm text-ink-400">{{ $t('ai.taskSuggestion.none') }}</p>

          <template v-else>
            <p class="text-body-sm text-ink-400 italic">{{ suggestion.explanation }}</p>

            <div class="space-y-3">
              <div>
                <label for="task-suggestion-title" class="block text-label text-ink-400 mb-2">{{ $t('tasks.form.title') }}</label>
                <input id="task-suggestion-title" v-model="form.title" type="text" class="vora-input" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="task-suggestion-priority" class="block text-label text-ink-400 mb-2">{{ $t('tasks.form.priority') }}</label>
                  <select id="task-suggestion-priority" v-model="form.priority" class="vora-input">
                    <option v-for="p in ['low', 'medium', 'high', 'urgent']" :key="p" :value="p">{{ $t(`tasks.priority.${p}`) }}</option>
                  </select>
                </div>
                <div>
                  <label for="task-suggestion-deadline" class="block text-label text-ink-400 mb-2">{{ $t('tasks.form.deadline') }}</label>
                  <input id="task-suggestion-deadline" v-model="form.deadline" type="date" class="vora-input" />
                </div>
              </div>
            </div>
          </template>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
              {{ $t('ai.taskSuggestion.reject') }}
            </button>
            <button
              v-if="suggestion"
              type="button"
              :disabled="saving"
              class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              @click="onConfirm"
            >
              {{ saving ? $t('tasks.form.saving') : $t('ai.taskSuggestion.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.vora-input {
  @apply w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body outline-none focus:border-primary transition-colors;
}
</style>
