<script setup lang="ts">
import type { Contact } from '~/shared/types/contact'

const props = defineProps<{ contact: Contact }>()
const emit = defineEmits<{ close: []; useAsFollowUp: [body: string] }>()
const { t } = useI18n()

const { communications, fetchCommunications } = useCommunications()
const { appointments, fetchAppointments } = useAppointments()

const loadingHistory = ref(true)

// The AI actions below reason over this contact's real history — not a
// generic prompt — so "summarize"/"follow-up" reflect what actually
// happened with this person, not a blank template.
const historyText = computed(() => {
  const relatedComms = communications.value
    .filter((c) => c.contactId === props.contact.id)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .slice(0, 10)
    .map((c) => `[${c.direction === 'inbound' ? 'Da' : 'A'} ${props.contact.firstName}] ${c.subject ? c.subject + ': ' : ''}${c.body}`)

  const relatedAppts = appointments.value
    .filter((a) => a.contactId === props.contact.id)
    .sort((a, b) => b.startAt.localeCompare(a.startAt))
    .slice(0, 5)
    .map((a) => `[Appuntamento] ${a.title} — ${new Date(a.startAt).toLocaleDateString('it-IT')} (${a.status})`)

  return [...relatedComms, ...relatedAppts].join('\n')
})

const hasHistory = computed(() => historyText.value.trim().length > 0)

const summaryLoading = ref(false)
const summary = ref('')
const summaryError = ref('')

const followUpLoading = ref(false)
const followUp = ref('')
const followUpError = ref('')

onMounted(async () => {
  await Promise.all([fetchCommunications(), fetchAppointments()])
  loadingHistory.value = false
})

async function onSummarize() {
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const res = await $fetch<{ summary: string }>('/api/ai/summarize', { method: 'POST', body: { text: historyText.value } })
    summary.value = res.summary
  } catch {
    summaryError.value = t('ai.errors.extract')
  } finally {
    summaryLoading.value = false
  }
}

async function onPrepareFollowUp() {
  followUpLoading.value = true
  followUpError.value = ''
  try {
    const res = await $fetch<{ body: string }>('/api/ai/reply', { method: 'POST', body: { text: historyText.value } })
    followUp.value = res.body
  } catch {
    followUpError.value = t('ai.errors.extract')
  } finally {
    followUpLoading.value = false
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
      aria-labelledby="ai-relationship-modal-title"
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
              <h2 id="ai-relationship-modal-title" class="text-h4 font-semibold">{{ $t('ai.relationship.title') }}</h2>
            </div>
            <button type="button" class="p-2 rounded-md hover:bg-ink-50 dark:hover:bg-white/5" :aria-label="$t('ai.actions.close')" @click="emit('close')">
              <UiIcon name="x" :size="16" />
            </button>
          </div>

          <div v-if="loadingHistory" class="h-10 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
          <p v-else-if="!hasHistory" class="text-body-sm text-ink-400">{{ $t('ai.relationship.noHistory') }}</p>

          <template v-else>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-body-sm font-medium">{{ $t('ai.relationship.summarize') }}</p>
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
                <p class="text-body-sm font-medium">{{ $t('ai.relationship.followUp') }}</p>
                <button
                  type="button"
                  :disabled="followUpLoading"
                  class="px-3 py-1.5 rounded-md text-caption font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
                  @click="onPrepareFollowUp"
                >
                  {{ followUpLoading ? $t('ai.actions.working') : $t('ai.actions.run') }}
                </button>
              </div>
              <p v-if="followUpError" class="text-body-sm text-danger">{{ followUpError }}</p>
              <template v-if="followUp">
                <textarea v-model="followUp" rows="3" class="w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary resize-none" />
                <button
                  type="button"
                  class="w-full px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
                  @click="emit('useAsFollowUp', followUp)"
                >
                  {{ $t('ai.relationship.useAsFollowUp') }}
                </button>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
