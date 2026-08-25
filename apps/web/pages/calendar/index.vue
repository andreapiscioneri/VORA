<script setup lang="ts">
import type { CalendarEvent } from '~/shared/types/event'
import { expandRecurringEvents } from '~/shared/utils/recurrence'

definePageMeta({ layout: 'default' })

const { events, pending, error, fetchEvents } = useEvents()
await fetchEvents()

const { locale } = useI18n()

const view = useState<'month' | 'agenda'>('calendar-view', () => 'month')
const cursor = ref(new Date())
const showForm = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const newEventDate = ref<string | undefined>(undefined)

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const monthLabel = computed(() =>
  cursor.value.toLocaleDateString(locale.value, { month: 'long', year: 'numeric' }),
)

// Monday-first short weekday labels in the current locale. Derived from
// Intl rather than `$tm('calendar.weekdays')` — vue-i18n's `$tm` returns
// compiled message AST nodes (not plain strings) once any other message in
// the same bundle uses ICU syntax like `{count}`, which needs `$rt()` to
// resolve; deriving from Intl sidesteps that entirely and stays correct
// for all 8 locales without a maintained translation array.
const weekdayLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
  // 2024-01-01 is a Monday — a fixed, known Monday-first reference week.
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2024, 0, 1 + i)))
})

const monthDays = computed(() => {
  const year = cursor.value.getFullYear()
  const month = cursor.value.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7 // Monday-first
  const gridStart = new Date(year, month, 1 - startOffset)

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    return date
  })
})

// Recurring events are stored once and expanded into individual occurrences
// only for display, bounded to whatever range the current view actually
// needs — the month grid, or a generous ±1 year window for the agenda list
// (which otherwise shows every event ever, recurring or not).
const expandedEvents = computed(() => {
  if (view.value === 'month') {
    const start = monthDays.value[0]
    const end = new Date(monthDays.value[41])
    end.setHours(23, 59, 59, 999)
    return expandRecurringEvents(events.value, start, end)
  }
  const start = new Date()
  start.setFullYear(start.getFullYear() - 1)
  const end = new Date()
  end.setFullYear(end.getFullYear() + 1)
  return expandRecurringEvents(events.value, start, end)
})

function eventsOn(date: Date) {
  const iso = isoDate(date)
  return expandedEvents.value.filter((e) => isoDate(new Date(e.startAt)) === iso)
}

function isToday(date: Date) {
  return isoDate(date) === isoDate(new Date())
}

function isCurrentMonth(date: Date) {
  return date.getMonth() === cursor.value.getMonth()
}

function prevMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)
}
function nextMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1)
}
function goToday() {
  cursor.value = new Date()
}

function openNewOnDate(date: Date) {
  editingEvent.value = null
  newEventDate.value = isoDate(date)
  showForm.value = true
}

function openEdit(ev: CalendarEvent) {
  // A clicked grid/agenda item might be an expanded occurrence (id
  // "<masterId>::N") of a recurring event — editing always edits the
  // whole series (its real master doc), not a single shifted occurrence.
  const masterId = ev.id.split('::')[0]
  editingEvent.value = events.value.find((e) => e.id === masterId) ?? ev
  newEventDate.value = undefined
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingEvent.value = null
}

const upcoming = computed(() =>
  [...expandedEvents.value].sort((a, b) => a.startAt.localeCompare(b.startAt)),
)

const groupedUpcoming = computed(() => {
  const groups = new Map<string, CalendarEvent[]>()
  for (const ev of upcoming.value) {
    const key = isoDate(new Date(ev.startAt))
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(ev)
  }
  return Array.from(groups.entries())
})

function formatDayHeading(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' })
}
// Formatted in the *event's* timezone, not the viewer's — an event stored
// as 15:00 Europe/Rome should always read "15:00", regardless of who's
// looking at the calendar or where they are.
function formatTime(iso: string, timezone: string) {
  return new Date(iso).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit', timeZone: timezone })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('calendar.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('calendar.subtitle', { count: events.length }) }}</p>
      </div>
      <div class="tablet:ml-auto flex items-center gap-3">
        <div class="hidden tablet:flex rounded-md border border-ink-100 dark:border-white/10 overflow-hidden">
          <button
            class="px-3 py-1.5 text-body-sm transition-colors"
            :class="view === 'month' ? 'bg-primary text-ink-950' : 'hover:bg-ink-50 dark:hover:bg-white/5'"
            @click="view = 'month'"
          >
            {{ $t('calendar.month') }}
          </button>
          <button
            class="px-3 py-1.5 text-body-sm transition-colors"
            :class="view === 'agenda' ? 'bg-primary text-ink-950' : 'hover:bg-ink-50 dark:hover:bg-white/5'"
            @click="view = 'agenda'"
          >
            {{ $t('calendar.agenda') }}
          </button>
        </div>
        <button
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
          @click="openNewOnDate(new Date())"
        >
          <UiIcon name="plus" :size="16" />
          {{ $t('calendar.new') }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="h-96 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="events.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('calendar.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('calendar.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNewOnDate(new Date())">
        {{ $t('calendar.empty.cta') }}
      </button>
    </div>

    <!-- Month grid: desktop/tablet only -->
    <div v-else-if="view === 'month'" class="hidden tablet:block space-y-3">
      <div class="flex items-center gap-2">
        <button class="p-2 rounded-md hover:bg-ink-50 dark:hover:bg-white/5" :aria-label="$t('calendar.prevMonth')" @click="prevMonth"><UiIcon name="chevron-left" :size="18" /></button>
        <button class="p-2 rounded-md hover:bg-ink-50 dark:hover:bg-white/5" :aria-label="$t('calendar.nextMonth')" @click="nextMonth"><UiIcon name="chevron-right" :size="18" /></button>
        <h2 class="text-h4 font-medium capitalize">{{ monthLabel }}</h2>
        <button class="ml-auto px-3 py-1.5 rounded-md text-body-sm border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5" @click="goToday">
          {{ $t('calendar.today') }}
        </button>
      </div>

      <div class="grid grid-cols-7 rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
        <div
          v-for="d in weekdayLabels"
          :key="d"
          class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400 text-center py-2"
        >
          {{ d }}
        </div>
        <div
          v-for="date in monthDays"
          :key="date.toISOString()"
          class="min-h-[104px] border-t border-ink-100 dark:border-white/10 p-2 space-y-1 cursor-pointer hover:bg-ink-50/50 dark:hover:bg-white/[0.03] transition-colors"
          :class="!isCurrentMonth(date) && 'opacity-40'"
          @click="openNewOnDate(date)"
        >
          <span
            class="inline-flex items-center justify-center size-6 rounded-full text-caption font-medium"
            :class="isToday(date) ? 'bg-primary text-ink-950' : 'text-ink-500 dark:text-paper-300'"
          >
            {{ date.getDate() }}
          </span>
          <button
            v-for="ev in eventsOn(date).slice(0, 3)"
            :key="ev.id"
            class="w-full flex items-center gap-1 text-left px-1.5 py-0.5 rounded text-caption truncate bg-primary/15 text-ink-900 dark:text-white hover:bg-primary/25 transition-colors"
            @click.stop="openEdit(ev)"
          >
            <UiIcon v-if="ev.recurrence.frequency !== 'none'" name="repeat" :size="10" class="shrink-0 opacity-70" />
            <span class="truncate">{{ ev.title }}</span>
          </button>
          <p v-if="eventsOn(date).length > 3" class="text-caption text-ink-400 px-1.5">+{{ eventsOn(date).length - 3 }}</p>
        </div>
      </div>
    </div>

    <!-- Agenda: always on mobile, toggle on desktop -->
    <div v-if="events.length" class="space-y-6" :class="{ 'tablet:hidden': view === 'month' }">
      <div v-for="[day, dayEvents] in groupedUpcoming" :key="day">
        <p class="text-body-sm font-medium capitalize mb-3">{{ formatDayHeading(day) }}</p>
        <div class="space-y-2">
          <button
            v-for="ev in dayEvents"
            :key="ev.id"
            class="w-full text-left flex items-center gap-3 rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 hover:border-primary/40 transition-colors"
            @click="openEdit(ev)"
          >
            <span class="text-body-sm font-medium text-primary-600 dark:text-primary w-16 shrink-0">
              {{ ev.allDay ? $t('calendar.form.allDay') : formatTime(ev.startAt, ev.timezone) }}
            </span>
            <span class="flex-1 min-w-0">
              <span class="flex items-center gap-1.5">
                <UiIcon v-if="ev.recurrence.frequency !== 'none'" name="repeat" :size="12" class="shrink-0 text-ink-400" />
                <span class="block text-body-sm font-medium truncate">{{ ev.title }}</span>
              </span>
              <span v-if="ev.location" class="block text-caption text-ink-400 truncate">{{ ev.location }}</span>
            </span>
          </button>
        </div>
      </div>
    </div>


    <CalendarEventForm v-if="showForm" :event="editingEvent" :default-date="newEventDate" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
