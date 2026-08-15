<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
const { locale } = useI18n()

const { tasks, fetchTasks } = useTasks()
const { events, fetchEvents } = useEvents()
const { appointments, fetchAppointments } = useAppointments()
const { communications, fetchCommunications } = useCommunications()

const loading = ref(true)
const answer = ref<{ title: string; lines: string[] } | null>(null)
const dialogRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  dialogRef.value?.focus()
  await Promise.all([fetchTasks(), fetchEvents(), fetchAppointments(), fetchCommunications()])
  loading.value = false
})

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}

function askOrganizeDay() {
  const today = todayIso()
  const items = [
    ...appointments.value.filter((a) => a.startAt.slice(0, 10) === today).map((a) => `${formatTime(a.startAt)} — ${a.title}`),
    ...events.value.filter((e) => e.startAt.slice(0, 10) === today).map((e) => `${formatTime(e.startAt)} — ${e.title}`),
    ...tasks.value.filter((t) => t.deadline === today && t.status !== 'completed').map((t) => `Scadenza oggi — ${t.title}`),
  ]
  answer.value = {
    title: 'Ecco la tua giornata',
    lines: items.length ? items : ['Nessun impegno in programma per oggi. Puoi concentrarti sulle priorità.'],
  }
}

function askPriorities() {
  const items = tasks.value
    .filter((t) => t.status !== 'completed' && t.status !== 'archived' && (t.priority === 'urgent' || t.priority === 'high'))
    .map((t) => `${t.priority === 'urgent' ? 'Urgente' : 'Alta'} — ${t.title}`)
  answer.value = {
    title: 'Le tue attività più importanti',
    lines: items.length ? items : ['Nessuna attività ad alta priorità al momento.'],
  }
}

function askUnanswered() {
  const items = communications.value
    .filter((c) => c.direction === 'inbound' && c.status === 'unread')
    .map((c) => `${c.subject || c.channel} — ${c.body.slice(0, 60)}${c.body.length > 60 ? '…' : ''}`)
  answer.value = {
    title: 'Messaggi da leggere',
    lines: items.length ? items : ['Sei in pari: nessun messaggio non letto.'],
  }
}

function askUpcoming() {
  const items = [...appointments.value, ...events.value]
    .filter((i) => new Date(i.startAt).getTime() >= Date.now())
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 5)
    .map((i) => `${new Date(i.startAt).toLocaleDateString(locale.value, { day: 'numeric', month: 'short' })} ${formatTime(i.startAt)} — ${i.title}`)
  answer.value = {
    title: 'Prossimi impegni',
    lines: items.length ? items : ['Nessun impegno in programma nei prossimi giorni.'],
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="dialogRef"
      class="fixed inset-0 z-50 flex justify-end bg-ink-950/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-panel-title"
      tabindex="-1"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:w-96 h-full bg-paper-50 dark:bg-ink-900 shadow-2xl overflow-y-auto animate-fade-up">
        <div class="p-5 border-b border-ink-100 dark:border-white/10 flex items-center gap-3">
          <UiBrandMark :size="28" />
          <div>
            <h2 id="assistant-panel-title" class="text-h4 font-semibold">{{ $t('assistant.title') }}</h2>
            <p class="text-caption text-ink-400">{{ $t('ai.provider') }}</p>
          </div>
          <button class="ml-auto p-2 rounded-md hover:bg-ink-50 dark:hover:bg-white/5" :aria-label="$t('assistant.close')" @click="emit('close')">
            <UiIcon name="x" :size="18" />
          </button>
        </div>

        <div v-if="loading" class="p-5 space-y-3">
          <div v-for="i in 3" :key="i" class="h-10 rounded-md bg-ink-50 dark:bg-white/5 animate-pulse" />
        </div>

        <div v-else class="p-5 space-y-5">
          <div class="grid grid-cols-1 gap-2">
            <button class="text-left px-4 py-3 rounded-md border border-ink-100 dark:border-white/10 hover:border-primary/40 text-body-sm transition-colors" @click="askOrganizeDay">
              {{ $t('assistant.prompts.organizeDay') }}
            </button>
            <button class="text-left px-4 py-3 rounded-md border border-ink-100 dark:border-white/10 hover:border-primary/40 text-body-sm transition-colors" @click="askPriorities">
              {{ $t('assistant.prompts.priorities') }}
            </button>
            <button class="text-left px-4 py-3 rounded-md border border-ink-100 dark:border-white/10 hover:border-primary/40 text-body-sm transition-colors" @click="askUnanswered">
              {{ $t('assistant.prompts.unanswered') }}
            </button>
            <button class="text-left px-4 py-3 rounded-md border border-ink-100 dark:border-white/10 hover:border-primary/40 text-body-sm transition-colors" @click="askUpcoming">
              {{ $t('assistant.prompts.upcoming') }}
            </button>
          </div>

          <div v-if="answer" class="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
            <p class="text-body-sm font-medium">{{ answer.title }}</p>
            <ul class="space-y-2">
              <li v-for="(line, i) in answer.lines" :key="i" class="text-body-sm text-ink-600 dark:text-paper-200 flex items-start gap-2">
                <span class="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                {{ line }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
