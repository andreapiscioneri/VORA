<script setup lang="ts">
import type { Communication } from '~/shared/types/communication'

const props = defineProps<{ communication: Communication }>()
const emit = defineEmits<{ close: []; useAsReply: [body: string] }>()
const { t } = useI18n()

const summaryLoading = ref(false)
const summary = ref('')
const summaryError = ref('')

const replyLoading = ref(false)
const reply = ref('')
const replyError = ref('')

async function onSummarize() {
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const res = await $fetch<{ summary: string }>('/api/ai/summarize', { method: 'POST', body: { text: props.communication.body } })
    summary.value = res.summary
  } catch {
    summaryError.value = t('ai.errors.extract')
  } finally {
    summaryLoading.value = false
  }
}

async function onGenerateReply() {
  replyLoading.value = true
  replyError.value = ''
  try {
    const res = await $fetch<{ body: string }>('/api/ai/reply', { method: 'POST', body: { text: props.communication.body } })
    reply.value = res.body
  } catch {
    replyError.value = t('ai.errors.extract')
  } finally {
    replyLoading.value = false
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
      aria-labelledby="ai-actions-modal-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-md rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <div class="p-6 space-y-6">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="flex items-center justify-center size-8 rounded-full bg-primary/15 text-primary-600 dark:text-primary">
                <UiIcon name="sparkles" :size="16" />
              </span>
              <h2 id="ai-actions-modal-title" class="text-h4 font-semibold">{{ $t('ai.actions.title') }}</h2>
            </div>
            <button type="button" class="p-2 rounded-md hover:bg-ink-50 dark:hover:bg-white/5" :aria-label="$t('ai.actions.close')" @click="emit('close')">
              <UiIcon name="x" :size="16" />
            </button>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-body-sm font-medium">{{ $t('ai.actions.summarize') }}</p>
              <button
                type="button"
                :disabled="summaryLoading"
                class="px-3 py-1.5 rounded-md text-caption font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
                @click="onSummarize"
              >
                {{ summaryLoading ? $t('ai.actions.working') : $t('ai.actions.run') }}
              </button>
            </div>
            <p v-if="summaryError" class="text-body-sm text-danger">{{ summaryError }}</p>
            <p v-if="summary" class="text-body-sm text-ink-500 dark:text-paper-300 bg-ink-50 dark:bg-white/5 rounded-md p-3">{{ summary }}</p>
          </div>

          <div class="space-y-3 border-t border-ink-100 dark:border-white/10 pt-5">
            <div class="flex items-center justify-between">
              <p class="text-body-sm font-medium">{{ $t('ai.actions.generateReply') }}</p>
              <button
                type="button"
                :disabled="replyLoading"
                class="px-3 py-1.5 rounded-md text-caption font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
                @click="onGenerateReply"
              >
                {{ replyLoading ? $t('ai.actions.working') : $t('ai.actions.run') }}
              </button>
            </div>
            <p v-if="replyError" class="text-body-sm text-danger">{{ replyError }}</p>
            <template v-if="reply">
              <textarea v-model="reply" rows="3" class="w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary resize-none" />
              <button
                type="button"
                class="w-full px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
                @click="emit('useAsReply', reply)"
              >
                {{ $t('ai.actions.useAsReply') }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
