<script setup lang="ts">
import type { Appointment } from '~/shared/types/appointment'

definePageMeta({ layout: 'default' })

const { appointments, pending, error, fetchAppointments } = useAppointments()
const { contacts, fetchContacts } = useContacts()
await Promise.all([fetchAppointments(), fetchContacts()])

const { locale } = useI18n()
const showForm = ref(false)
const editingAppt = ref<Appointment | null>(null)

// Supports the ⌘K command palette's "New appointment" action (?action=new).
const route = useRoute()
if (route.query.action === 'new') showForm.value = true

function contactName(contactId: string | null) {
  if (!contactId) return ''
  const c = contacts.value.find((c) => c.id === contactId)
  return c ? `${c.firstName} ${c.lastName}` : ''
}

const upcoming = computed(() => appointments.value.filter((a) => new Date(a.startAt).getTime() >= Date.now()))
const past = computed(() =>
  [...appointments.value].filter((a) => new Date(a.startAt).getTime() < Date.now()).reverse(),
)

function openNew() {
  editingAppt.value = null
  showForm.value = true
}

function openEdit(appt: Appointment) {
  editingAppt.value = appt
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingAppt.value = null
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(locale.value, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const statusStyles: Record<string, string> = {
  scheduled: 'bg-info/10 text-info',
  confirmed: 'bg-success/10 text-success',
  completed: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
  cancelled: 'bg-danger/10 text-danger',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('appointments.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('appointments.subtitle', { count: appointments.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('appointments.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="appointments.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('appointments.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('appointments.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('appointments.empty.cta') }}
      </button>
    </div>

    <template v-else>
      <div v-if="upcoming.length" class="space-y-3">
        <p class="text-body-sm font-medium text-ink-400">{{ $t('appointments.upcoming') }}</p>
        <button
          v-for="a in upcoming"
          :key="a.id"
          class="w-full text-left flex items-center gap-4 rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 hover:border-primary/40 transition-colors"
          @click="openEdit(a)"
        >
          <span class="text-body-sm font-medium text-primary-600 dark:text-primary w-32 shrink-0 capitalize">{{ formatDateTime(a.startAt) }}</span>
          <span class="flex-1 min-w-0">
            <span class="block text-body-sm font-medium truncate">{{ a.title }}</span>
            <span class="block text-caption text-ink-400 truncate">{{ [contactName(a.contactId), a.location].filter(Boolean).join(' · ') || '—' }}</span>
          </span>
          <a
            v-if="a.videoCallUrl"
            :href="a.videoCallUrl"
            target="_blank"
            rel="noopener"
            class="shrink-0 text-caption text-primary-600 dark:text-primary hover:underline"
            @click.stop
          >
            {{ $t('appointments.joinCall') }}
          </a>
          <span class="shrink-0 px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[a.status]">
            {{ $t(`appointments.status.${a.status}`) }}
          </span>
        </button>
      </div>

      <div v-if="past.length" class="space-y-3">
        <p class="text-body-sm font-medium text-ink-400">{{ $t('appointments.past') }}</p>
        <button
          v-for="a in past"
          :key="a.id"
          class="w-full text-left flex items-center gap-4 rounded-lg border border-ink-100 dark:border-white/10 p-4 opacity-60 hover:opacity-100 transition-opacity"
          @click="openEdit(a)"
        >
          <span class="text-body-sm font-medium w-32 shrink-0 capitalize">{{ formatDateTime(a.startAt) }}</span>
          <span class="flex-1 min-w-0">
            <span class="block text-body-sm font-medium truncate">{{ a.title }}</span>
            <span class="block text-caption text-ink-400 truncate">{{ contactName(a.contactId) || '—' }}</span>
          </span>
          <span class="shrink-0 px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[a.status]">
            {{ $t(`appointments.status.${a.status}`) }}
          </span>
        </button>
      </div>
    </template>

    <AppointmentsAppointmentForm v-if="showForm" :appointment="editingAppt" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
