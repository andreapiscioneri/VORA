<script setup lang="ts">
import type { TimesheetEntry } from '~/shared/types/timesheet'

definePageMeta({ layout: 'default' })

const { entries, pending, error, fetchEntries, createEntry } = useTimesheets()
const { projects, fetchProjects } = useProjects()
await Promise.all([fetchEntries(), fetchProjects()])

const timer = useTimer()
const timerDescription = ref(timer.description.value)
const timerProjectId = ref<string | null>(timer.projectId.value)

const showForm = ref(false)
const editingEntry = ref<TimesheetEntry | null>(null)

function projectName(projectId: string | null) {
  if (!projectId) return ''
  const p = projects.value.find((p) => p.id === projectId)
  return p ? p.name : ''
}

function startTimer() {
  timer.start(timerProjectId.value, timerDescription.value)
}

async function stopTimer() {
  const result = timer.stop()
  if (!result) return
  const minutes = Math.max(1, Math.round((Date.now() - new Date(result.startedAt).getTime()) / 60000))
  await createEntry({
    projectId: result.projectId,
    taskId: null,
    description: result.description,
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: minutes,
    billable: true,
  })
  timerDescription.value = ''
  timerProjectId.value = null
}

function openNew() {
  editingEntry.value = null
  showForm.value = true
}

function openEdit(entry: TimesheetEntry) {
  editingEntry.value = entry
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingEntry.value = null
}

const totalHours = computed(() => {
  const minutes = entries.value.reduce((acc, e) => acc + e.durationMinutes, 0)
  return (minutes / 60).toFixed(1)
})

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const groupedEntries = computed(() => {
  const groups = new Map<string, TimesheetEntry[]>()
  for (const e of entries.value) {
    if (!groups.has(e.date)) groups.set(e.date, [])
    groups.get(e.date)!.push(e)
  }
  return Array.from(groups.entries())
})

const { locale } = useI18n()
function formatDayHeading(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('timesheets.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('timesheets.subtitle', { count: entries.length, hours: totalHours }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('timesheets.new') }}
      </button>
    </div>

    <!-- Timer widget -->
    <div class="rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 flex flex-col tablet:flex-row tablet:items-center gap-3">
      <div class="flex items-center gap-3">
        <span class="flex items-center justify-center size-10 rounded-full" :class="timer.isRunning.value ? 'bg-primary/15 text-primary-600 dark:text-primary' : 'bg-ink-50 dark:bg-white/5 text-ink-400'">
          <UiIcon name="timer" :size="18" />
        </span>
        <span class="font-mono text-h4 tabular-nums w-28">{{ timer.elapsedLabel.value }}</span>
      </div>

      <input
        v-model="timerDescription"
        type="text"
        :disabled="timer.isRunning.value"
        :placeholder="$t('timesheets.timer.descriptionPlaceholder')"
        class="flex-1 px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary disabled:opacity-60"
      />
      <select
        v-model="timerProjectId"
        :disabled="timer.isRunning.value"
        class="px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary disabled:opacity-60"
      >
        <option :value="null">{{ $t('timesheets.form.noProject') }}</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>

      <button
        v-if="!timer.isRunning.value"
        class="shrink-0 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="startTimer"
      >
        {{ $t('timesheets.timer.start') }}
      </button>
      <button
        v-else
        class="shrink-0 px-4 py-2 rounded-md text-body-sm font-medium bg-danger text-white hover:bg-danger/90 transition-colors"
        @click="stopTimer"
      >
        {{ $t('timesheets.timer.stop') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="entries.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('timesheets.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('timesheets.empty.subtitle') }}</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="[day, dayEntries] in groupedEntries" :key="day">
        <p class="text-body-sm font-medium capitalize mb-3">{{ formatDayHeading(day) }}</p>
        <div class="space-y-2">
          <button
            v-for="e in dayEntries"
            :key="e.id"
            class="w-full text-left flex items-center gap-3 rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 hover:border-primary/40 transition-colors"
            @click="openEdit(e)"
          >
            <span class="flex-1 min-w-0">
              <span class="block text-body-sm font-medium truncate">{{ e.description || projectName(e.projectId) || '—' }}</span>
              <span class="block text-caption text-ink-400 truncate">
                {{ projectName(e.projectId) || '—' }}
                <span v-if="!e.billable"> · {{ $t('timesheets.noBillable') }}</span>
              </span>
            </span>
            <span class="text-body-sm font-semibold text-primary-600 dark:text-primary shrink-0">{{ formatDuration(e.durationMinutes) }}</span>
          </button>
        </div>
      </div>
    </div>

    <TimesheetsEntryForm v-if="showForm" :entry="editingEntry" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
