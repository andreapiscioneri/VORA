<script setup lang="ts">
import type { CalendarEvent, CalendarEventInput } from '~/shared/types/event'
import { calendarEventInputSchema } from '~/shared/validation/event'

const props = defineProps<{ event?: CalendarEvent | null; defaultDate?: string }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createEvent, updateEvent, removeEvent } = useEvents()
const { contacts, fetchContacts } = useContacts()
const { t } = useI18n()

if (!contacts.value.length) await fetchContacts()

const isEdit = computed(() => !!props.event)

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const defaultStart = props.defaultDate ? `${props.defaultDate}T09:00` : toLocalInput(new Date().toISOString())
const defaultEnd = props.defaultDate ? `${props.defaultDate}T10:00` : toLocalInput(new Date(Date.now() + 3600_000).toISOString())

// A curated common set rather than the full ~400-zone IANA list — Intl
// itself has no "list all timezones" API in older engines, and a full list
// would be a huge, mostly-irrelevant dropdown; falls back to whatever
// Intl.supportedValuesOf reports when the runtime has it (Node 20+ /
// modern browsers), so it's never wrong, just occasionally shorter.
const timezoneOptions = (() => {
  try {
    if (typeof Intl.supportedValuesOf === 'function') return Intl.supportedValuesOf('timeZone') as string[]
  } catch {
    // fall through to the curated list below
  }
  return [
    'UTC', 'Europe/Rome', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Moscow',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo',
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Asia/Kolkata', 'Australia/Sydney',
  ]
})()

const form = reactive<CalendarEventInput>({
  title: props.event?.title ?? '',
  description: props.event?.description ?? '',
  startAt: props.event ? toLocalInput(props.event.startAt) : defaultStart,
  endAt: props.event ? toLocalInput(props.event.endAt) : defaultEnd,
  allDay: props.event?.allDay ?? false,
  location: props.event?.location ?? '',
  contactId: props.event?.contactId ?? null,
  timezone: props.event?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  recurrence: props.event?.recurrence ?? { frequency: 'none', interval: 1, until: null },
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const payload = {
    ...form,
    startAt: new Date(form.startAt).toISOString(),
    endAt: new Date(form.endAt).toISOString(),
    recurrence: { ...form.recurrence, until: form.recurrence.until || null },
  }

  const result = calendarEventInputSchema.safeParse(payload)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.event) {
      await updateEvent(props.event.id, result.data)
    } else {
      await createEvent(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('calendar.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.event) return
  if (!confirm(t('calendar.deleteConfirm'))) return
  await removeEvent(props.event.id)
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
      aria-labelledby="event-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="event-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('calendar.form.editTitle') : $t('calendar.form.newTitle') }}
          </h2>

          <div>
            <label for="event-title" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.title') }}</label>
            <input id="event-title" v-model="form.title" type="text" class="vora-input" :class="{ 'border-danger': errors.title }" autofocus >
            <p v-if="errors.title" class="text-caption text-danger mt-1">{{ errors.title }}</p>
          </div>

          <label class="flex items-center gap-2 text-body-sm">
            <input v-model="form.allDay" type="checkbox" class="size-4 rounded accent-primary" >
            {{ $t('calendar.form.allDay') }}
          </label>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="event-startAt" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.start') }}</label>
              <input id="event-startAt" v-model="form.startAt" :type="form.allDay ? 'date' : 'datetime-local'" class="vora-input" :class="{ 'border-danger': errors.startAt }" >
            </div>
            <div>
              <label for="event-endAt" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.end') }}</label>
              <input id="event-endAt" v-model="form.endAt" :type="form.allDay ? 'date' : 'datetime-local'" class="vora-input" :class="{ 'border-danger': errors.endAt }" >
              <p v-if="errors.endAt" class="text-caption text-danger mt-1">{{ errors.endAt }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="event-location" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.location') }}</label>
              <input id="event-location" v-model="form.location" type="text" class="vora-input" >
            </div>
            <div>
              <label for="event-contactId" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.contact') }}</label>
              <select id="event-contactId" v-model="form.contactId" class="vora-input">
                <option :value="null">{{ $t('calendar.form.noContact') }}</option>
                <option v-for="c in contacts" :key="c.id" :value="c.id">{{ c.firstName }} {{ c.lastName }}</option>
              </select>
            </div>
          </div>

          <div>
            <label for="event-timezone" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.timezone') }}</label>
            <select id="event-timezone" v-model="form.timezone" class="vora-input">
              <option v-for="tz in timezoneOptions" :key="tz" :value="tz">{{ tz }}</option>
            </select>
          </div>

          <div class="space-y-3">
            <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
              <div>
                <label for="event-recurrence-frequency" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.repeat') }}</label>
                <select id="event-recurrence-frequency" v-model="form.recurrence.frequency" class="vora-input">
                  <option value="none">{{ $t('calendar.recurrence.none') }}</option>
                  <option value="daily">{{ $t('calendar.recurrence.daily') }}</option>
                  <option value="weekly">{{ $t('calendar.recurrence.weekly') }}</option>
                  <option value="monthly">{{ $t('calendar.recurrence.monthly') }}</option>
                </select>
              </div>
              <div v-if="form.recurrence.frequency !== 'none'">
                <label for="event-recurrence-interval" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.repeatEvery') }}</label>
                <input id="event-recurrence-interval" v-model.number="form.recurrence.interval" type="number" min="1" max="365" class="vora-input" >
              </div>
            </div>
            <div v-if="form.recurrence.frequency !== 'none'">
              <label for="event-recurrence-until" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.repeatUntil') }}</label>
              <input id="event-recurrence-until" v-model="form.recurrence.until" type="date" class="vora-input" :class="{ 'border-danger': errors.until }" >
              <p v-if="errors.until" class="text-caption text-danger mt-1">{{ errors.until }}</p>
            </div>
          </div>

          <div>
            <label for="event-description" class="block text-label text-ink-400 mb-2">{{ $t('calendar.form.description') }}</label>
            <textarea id="event-description" v-model="form.description" rows="3" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('calendar.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('calendar.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('calendar.form.saving') : $t('calendar.form.save') }}
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
