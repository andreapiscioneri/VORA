<script setup lang="ts">
import type { LeaveStatus } from '~/shared/types/leave'

definePageMeta({ layout: 'default' })

const { requests, pending, error, fetchRequests, setStatus } = useLeaveRequests()
await fetchRequests()

const { locale } = useI18n()
const showForm = ref(false)
const statusFilter = ref<LeaveStatus | 'all'>('all')

const ANNUAL_ALLOCATION = 20

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(ms / 86400000) + 1
}

const filtered = computed(() =>
  statusFilter.value === 'all' ? requests.value : requests.value.filter((r) => r.status === statusFilter.value),
)

const currentYear = new Date().getFullYear()

const usedDays = computed(() =>
  requests.value
    .filter((r) => r.type === 'vacation' && r.status === 'approved' && new Date(r.startDate).getFullYear() === currentYear)
    .reduce((acc, r) => acc + daysBetween(r.startDate, r.endDate), 0),
)

const remainingDays = computed(() => Math.max(0, ANNUAL_ALLOCATION - usedDays.value))

function openNew() {
  showForm.value = true
}

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('leave.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('leave.subtitle', { count: requests.length }) }}</p>
      </div>
      <div class="tablet:ml-auto flex items-center gap-3">
        <div class="flex rounded-md border border-ink-100 dark:border-white/10 overflow-hidden">
          <button
            v-for="s in ['all', 'pending', 'approved', 'rejected']"
            :key="s"
            class="px-3 py-1.5 text-body-sm transition-colors"
            :class="statusFilter === s ? 'bg-primary text-ink-950' : 'hover:bg-ink-50 dark:hover:bg-white/5'"
            @click="statusFilter = s as any"
          >
            {{ s === 'all' ? $t('leave.all') : $t(`leave.status.${s}`) }}
          </button>
        </div>
        <button
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
          @click="openNew"
        >
          <UiIcon name="plus" :size="16" />
          {{ $t('leave.new') }}
        </button>
      </div>
    </div>

    <div class="rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5">
      <p class="text-body-sm font-medium mb-4">{{ $t('leave.balance.title') }} {{ currentYear }}</p>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <p class="text-h2 font-semibold">{{ ANNUAL_ALLOCATION }}</p>
          <p class="text-caption text-ink-400">{{ $t('leave.balance.allocated') }}</p>
        </div>
        <div>
          <p class="text-h2 font-semibold text-warning">{{ usedDays }}</p>
          <p class="text-caption text-ink-400">{{ $t('leave.balance.used') }}</p>
        </div>
        <div>
          <p class="text-h2 font-semibold text-success">{{ remainingDays }}</p>
          <p class="text-caption text-ink-400">{{ $t('leave.balance.remaining') }}</p>
        </div>
      </div>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="filtered.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('leave.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('leave.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('leave.empty.cta') }}
      </button>
    </div>

    <div v-else class="space-y-2">
      <div v-for="r in filtered" :key="r.id" class="flex items-center gap-4 rounded-lg border border-ink-100 dark:border-white/10 p-4">
        <div class="flex-1 min-w-0">
          <p class="text-body-sm font-medium">{{ r.requesterName }} · {{ $t(`leave.type.${r.type}`) }}</p>
          <p class="text-caption text-ink-400 mt-1">
            {{ new Date(r.startDate).toLocaleDateString(locale) }} — {{ new Date(r.endDate).toLocaleDateString(locale) }}
            ({{ daysBetween(r.startDate, r.endDate) }} {{ $t('leave.balance.days') }})
          </p>
        </div>
        <span class="px-2 py-1 rounded-full text-caption font-medium shrink-0" :class="statusStyles[r.status]">{{ $t(`leave.status.${r.status}`) }}</span>
        <div v-if="r.status === 'pending'" class="flex gap-2 shrink-0">
          <button class="text-caption text-success hover:underline" @click="setStatus(r, 'approved')">{{ $t('leave.approve') }}</button>
          <button class="text-caption text-danger hover:underline" @click="setStatus(r, 'rejected')">{{ $t('leave.reject') }}</button>
        </div>
      </div>
    </div>

    <LeaveForm v-if="showForm" @close="showForm = false" @saved="showForm = false" />
  </div>
</template>
