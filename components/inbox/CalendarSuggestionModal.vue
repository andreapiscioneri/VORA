<script setup lang="ts">
import type { CalendarEventSuggestion } from '~/shared/types/ai'
import type { Communication } from '~/shared/types/communication'

const props = defineProps<{ communication: Communication }>()
const emit = defineEmits<{ close: []; created: [] }>()

const { events, fetchEvents, createEvent } = useEvents()
const { appointments, fetchAppointments } = useAppointments()
const { t } = useI18n()

const loading = ref(true)
const suggestion = ref<CalendarEventSuggestion | null>(null)
const loadError = ref('')
const saving = ref(false)

const CANDIDATE_HOURS = ['09:00', '11:00', '14:00', '16:00']

const form = reactive({ title: '', date: '' as string, time: '' as string, durationMinutes: 60 })

// A slot is busy if any real event/appointment on the same date overlaps
// the candidate [start, start+duration) window — this is what makes the
// suggested times "inspect calendar availability", not a guess.
function isSlotBusy(date: string, time: string, durationMinutes: number): boolean {
  const start = new Date(`${date}T${time}:00`).getTime()
  const end = start + durationMinutes * 60_000
  const overlaps = (otherStart: number, otherEnd: number) => start < otherEnd && otherStart < end

  for (const e of events.value) {
    if (e.startAt.slice(0, 10) !== date) continue
    if (overlaps(new Date(e.startAt).getTime(), new Date(e.endAt).getTime())) return true
  }
  for (const a of appointments.value) {
    if (a.startAt.slice(0, 10) !== date) continue
    const aStart = new Date(a.startAt).getTime()
    if (overlaps(aStart, aStart + a.durationMinutes * 60_000)) return true
  }
  return false
}

const candidateSlots = computed(() => {
  if (!form.date) return []
  const hours = suggestion.value?.time && !CANDIDATE_HOURS.includes(suggestion.value.time)
    ? [suggestion.value.time, ...CANDIDATE_HOURS]
    : CANDIDATE_HOURS
  return hours.map((time) => ({ time, busy: isSlotBusy(form.date, time, form.durationMinutes) }))
})

onMounted(async () => {
  await Promise.all([fetchEvents(), fetchAppointments()])
  try {
    const res = await $fetch<{ suggestion: CalendarEventSuggestion | null }>('/api/ai/calendar-suggestion', {
      method: 'POST',
      body: { text: props.communication.body },
    })
    suggestion.value = res.suggestion
    if (res.suggestion) {
      form.title = res.suggestion.title
      form.date = res.suggestion.date ?? new Date().toISOString().slice(0, 10)
      form.durationMinutes = res.suggestion.durationMinutes
      const firstFree = candidateSlots.value.find((s) => !s.busy)
      form.time = res.suggestion.time ?? firstFree?.time ?? CANDIDATE_HOURS[0]
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
    const startAt = new Date(`${form.date}T${form.time}:00`).toISOString()
    const endAt = new Date(new Date(startAt).getTime() + form.durationMinutes * 60_000).toISOString()
    await createEvent({
      title: form.title,
      description: props.communication.body,
      startAt,
      endAt,
      allDay: false,
      location: '',
      contactId: props.communication.contactId,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      recurrence: { frequency: 'none', interval: 1, until: null },
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
      aria-labelledby="calendar-suggestion-modal-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-md rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <div class="p-6 space-y-5">
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center size-8 rounded-full bg-primary/15 text-primary-600 dark:text-primary">
              <UiIcon name="clock" :size="16" />
            </span>
            <h2 id="calendar-suggestion-modal-title" class="text-h4 font-semibold">{{ $t('ai.calendarSuggestion.title') }}</h2>
          </div>

          <div v-if="loading" class="h-20 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />

          <p v-else-if="loadError" class="text-body-sm text-danger">{{ loadError }}</p>

          <p v-else-if="!suggestion" class="text-body-sm text-ink-400">{{ $t('ai.calendarSuggestion.none') }}</p>

          <template v-else>
            <p class="text-body-sm text-ink-400 italic">{{ suggestion.explanation }}</p>

            <div class="space-y-3">
              <div>
                <label for="cal-suggestion-title" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.title') }}</label>
                <input id="cal-suggestion-title" v-model="form.title" type="text" class="vora-input" />
              </div>
              <div>
                <label for="cal-suggestion-date" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.date') }}</label>
                <input id="cal-suggestion-date" v-model="form.date" type="date" class="vora-input" />
              </div>
              <div>
                <p class="block text-label text-ink-400 mb-2">{{ $t('ai.calendarSuggestion.pickSlot') }}</p>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="slot in candidateSlots"
                    :key="slot.time"
                    type="button"
                    :disabled="slot.busy"
                    class="px-3 py-2 rounded-md text-body-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :class="form.time === slot.time
                      ? 'border-primary bg-primary/10 text-primary-600 dark:text-primary'
                      : 'border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5'"
                    @click="form.time = slot.time"
                  >
                    {{ slot.time }}
                    <span v-if="slot.busy" class="block text-caption text-ink-400">{{ $t('ai.calendarSuggestion.busy') }}</span>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
              {{ $t('ai.calendarSuggestion.reject') }}
            </button>
            <button
              v-if="suggestion"
              type="button"
              :disabled="saving"
              class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              @click="onConfirm"
            >
              {{ saving ? $t('tasks.form.saving') : $t('ai.calendarSuggestion.confirm') }}
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
