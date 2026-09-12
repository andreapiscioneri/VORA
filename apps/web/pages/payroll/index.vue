<script setup lang="ts">
import type { PayrollRecord } from '~/shared/types/payroll'

definePageMeta({ layout: 'default' })

const { records, pending, error, hasMore, loadingMore, fetchRecords, loadMore } = usePayroll()
await fetchRecords()

const showForm = ref(false)
const editingRecord = ref<PayrollRecord | null>(null)

function openNew() {
  editingRecord.value = null
  showForm.value = true
}

function openEdit(record: PayrollRecord) {
  editingRecord.value = record
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingRecord.value = null
}

const statusStyles: Record<string, string> = {
  draft: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
  issued: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('payroll.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('payroll.subtitle', { count: records.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('payroll.new') }}
      </button>
    </div>

    <p class="text-caption text-ink-400">{{ $t('payroll.disclaimer') }}</p>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="records.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('payroll.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('payroll.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('payroll.empty.cta') }}
      </button>
    </div>

    <div v-else class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
      <table class="w-full text-body-sm">
        <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">{{ $t('payroll.columns.employee') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('payroll.columns.period') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('payroll.columns.netAmount') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('payroll.columns.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in records"
            :key="r.id"
            class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 cursor-pointer"
            @click="openEdit(r)"
          >
            <td class="px-4 py-3 font-medium">{{ r.employeeName }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ r.period }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ r.netAmount.toFixed(2) }} €</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[r.status]">{{ $t(`payroll.status.${r.status}`) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!pending && !error && records.length" class="tablet:hidden space-y-3">
      <button v-for="r in records" :key="r.id" class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 p-4" @click="openEdit(r)">
        <p class="font-medium">{{ r.employeeName }}</p>
        <p class="text-body-sm text-ink-400 mt-1">{{ r.period }} · {{ r.netAmount.toFixed(2) }} €</p>
        <span class="inline-block mt-2 px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[r.status]">{{ $t(`payroll.status.${r.status}`) }}</span>
      </button>
    </div>

    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('payroll.loadingMore') : $t('payroll.loadMore') }}
      </button>
    </div>

    <PayrollRecordForm v-if="showForm" :record="editingRecord" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
