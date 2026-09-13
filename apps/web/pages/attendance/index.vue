<script setup lang="ts">
import type { AttendanceEntry } from '~/shared/types/attendance'

definePageMeta({ layout: 'default' })
const router = useRouter()

const { entries, pending, error, hasMore, loadingMore, fetchEntries, loadMore } = useAttendance()
await fetchEntries()

const showForm = ref(false)
const editingEntry = ref<AttendanceEntry | null>(null)

function openNew() {
  editingEntry.value = null
  showForm.value = true
}

function openEdit(entry: AttendanceEntry) {
  editingEntry.value = entry
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingEntry.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <div class="flex items-center gap-3">
          <button
            class="shrink-0 size-9 flex items-center justify-center rounded-md hover:bg-ink-50 dark:hover:bg-white/5 text-ink-600 dark:text-paper-300"
            :aria-label="$t('common.back')"
            @click="router.back()"
          >
            <UiIcon name="arrow-left" :size="20" />
          </button>
          <h1 class="text-h1 font-semibold tracking-tight">{{ $t('attendance.title') }}</h1>
        </div>
        <p class="text-body text-ink-400 mt-1">{{ $t('attendance.subtitle', { count: entries.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('attendance.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="entries.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('attendance.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('attendance.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('attendance.empty.cta') }}
      </button>
    </div>

    <div v-else class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
      <table class="w-full text-body-sm">
        <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">{{ $t('attendance.columns.employee') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('attendance.columns.date') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('attendance.columns.checkIn') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('attendance.columns.checkOut') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="e in entries"
            :key="e.id"
            class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 cursor-pointer"
            @click="openEdit(e)"
          >
            <td class="px-4 py-3 font-medium">{{ e.employeeName }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ new Date(e.date).toLocaleDateString('it-IT') }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ e.checkIn || '—' }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ e.checkOut || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!pending && !error && entries.length" class="tablet:hidden space-y-3">
      <button v-for="e in entries" :key="e.id" class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 p-4" @click="openEdit(e)">
        <p class="font-medium">{{ e.employeeName }}</p>
        <p class="text-body-sm text-ink-400 mt-1">{{ new Date(e.date).toLocaleDateString('it-IT') }} · {{ e.checkIn || '—' }}–{{ e.checkOut || '—' }}</p>
      </button>
    </div>

    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('attendance.loadingMore') : $t('attendance.loadMore') }}
      </button>
    </div>

    <AttendanceForm v-if="showForm" :entry="editingEntry" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
