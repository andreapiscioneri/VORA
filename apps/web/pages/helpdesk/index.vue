<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { tickets, pending, error, hasMore, loadingMore, fetchTickets, loadMore } = useTickets()
const { contacts, fetchContacts } = useContacts()
const { locale } = useI18n()
await Promise.all([fetchTickets(), fetchContacts()])

const showForm = ref(false)

function contactName(contactId: string | null) {
  if (!contactId) return ''
  const c = contacts.value.find((c) => c.id === contactId)
  return c ? `${c.firstName} ${c.lastName}` : ''
}

const statusStyles: Record<string, string> = {
  open: 'bg-info/10 text-info',
  in_progress: 'bg-warning/10 text-warning',
  waiting: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
  resolved: 'bg-success/10 text-success',
  closed: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
}

const priorityStyles: Record<string, string> = {
  low: 'text-ink-400',
  medium: 'text-info',
  high: 'text-warning',
  urgent: 'text-danger',
}

function slaStyle(slaDueAt: string | null) {
  if (!slaDueAt) return ''
  const diff = new Date(slaDueAt).getTime() - Date.now()
  if (diff < 0) return 'text-danger'
  if (diff < 1000 * 60 * 60 * 4) return 'text-warning'
  return 'text-ink-400'
}

function formatSla(slaDueAt: string) {
  return new Date(slaDueAt).toLocaleString(locale.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('helpdesk.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('helpdesk.subtitle', { count: tickets.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="showForm = true"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('helpdesk.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="tickets.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('helpdesk.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('helpdesk.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="showForm = true">
        {{ $t('helpdesk.empty.cta') }}
      </button>
    </div>

    <div v-else class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
      <table class="w-full text-body-sm">
        <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">{{ $t('helpdesk.columns.title') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('helpdesk.columns.customer') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('helpdesk.columns.category') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('helpdesk.columns.priority') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('helpdesk.columns.status') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('helpdesk.columns.sla') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tickets" :key="t.id" class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5">
            <td class="px-4 py-3">
              <NuxtLink :to="`/helpdesk/${t.id}`" class="font-medium hover:text-primary-600">{{ t.title }}</NuxtLink>
            </td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ contactName(t.contactId) || '—' }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ $t(`helpdesk.category.${t.category}`) }}</td>
            <td class="px-4 py-3" :class="priorityStyles[t.priority]">{{ $t(`tasks.priority.${t.priority}`) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[t.status]">{{ $t(`helpdesk.status.${t.status}`) }}</span>
            </td>
            <td class="px-4 py-3">
              <span v-if="t.slaDueAt" class="flex items-center gap-1 text-caption" :class="slaStyle(t.slaDueAt)">
                <UiIcon name="clock" :size="13" />
                {{ formatSla(t.slaDueAt) }}
              </span>
              <span v-else class="text-ink-300 dark:text-white/20">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!pending && !error && tickets.length" class="tablet:hidden space-y-3">
      <NuxtLink v-for="t in tickets" :key="t.id" :to="`/helpdesk/${t.id}`" class="block rounded-lg border border-ink-100 dark:border-white/10 p-4">
        <p class="font-medium">{{ t.title }}</p>
        <p class="text-body-sm text-ink-400 mt-1">{{ contactName(t.contactId) || '—' }}</p>
        <div class="flex items-center gap-2 mt-2 flex-wrap">
          <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[t.status]">{{ $t(`helpdesk.status.${t.status}`) }}</span>
          <span v-if="t.slaDueAt" class="flex items-center gap-1 text-caption" :class="slaStyle(t.slaDueAt)">
            <UiIcon name="clock" :size="13" />
            {{ formatSla(t.slaDueAt) }}
          </span>
        </div>
      </NuxtLink>
    </div>

    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('helpdesk.loadingMore') : $t('helpdesk.loadMore') }}
      </button>
    </div>

    <HelpdeskTicketForm v-if="showForm" @close="showForm = false" @saved="showForm = false" />
  </div>
</template>
