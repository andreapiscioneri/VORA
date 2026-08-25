<script setup lang="ts">
import type { Expense, ExpenseStatus } from '~/shared/types/expense'

definePageMeta({ layout: 'default' })

const { expenses, pending, error, hasMore, loadingMore, fetchExpenses, loadMore, setStatus } = useExpenses()
const { projects, fetchProjects } = useProjects()
await Promise.all([fetchExpenses(), fetchProjects()])

const { locale } = useI18n()
const showForm = ref(false)
const editingExpense = ref<Expense | null>(null)
const statusFilter = ref<ExpenseStatus | 'all'>('all')

const filtered = computed(() =>
  statusFilter.value === 'all' ? expenses.value : expenses.value.filter((e) => e.status === statusFilter.value),
)

const total = computed(() => {
  const sum = filtered.value.filter((e) => e.status !== 'rejected').reduce((acc, e) => acc + e.amount, 0)
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(sum)
})

function projectName(projectId: string | null) {
  if (!projectId) return ''
  const p = projects.value.find((p) => p.id === projectId)
  return p ? p.name : ''
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

function openNew() {
  editingExpense.value = null
  showForm.value = true
}

function openEdit(expense: Expense) {
  editingExpense.value = expense
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingExpense.value = null
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
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('expenses.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('expenses.subtitle', { count: filtered.length, total }) }}</p>
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
            {{ s === 'all' ? $t('expenses.all') : $t(`expenses.status.${s}`) }}
          </button>
        </div>
        <button
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
          @click="openNew"
        >
          <UiIcon name="plus" :size="16" />
          {{ $t('expenses.new') }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="filtered.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('expenses.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('expenses.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('expenses.empty.cta') }}
      </button>
    </div>

    <div v-else class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
      <table class="w-full text-body-sm">
        <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">{{ $t('expenses.columns.date') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('expenses.columns.category') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('expenses.columns.project') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('expenses.columns.amount') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('expenses.columns.status') }}</th>
            <th class="w-40" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filtered" :key="e.id" class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5">
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ new Date(e.date).toLocaleDateString(locale) }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ $t(`expenses.category.${e.category}`) }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ projectName(e.projectId) || '—' }}</td>
            <td class="px-4 py-3 font-medium cursor-pointer" @click="openEdit(e)">{{ formatAmount(e.amount, e.currency) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[e.status]">{{ $t(`expenses.status.${e.status}`) }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button v-if="e.status === 'pending'" class="text-caption text-success hover:underline mr-3" @click="setStatus(e, 'approved')">
                {{ $t('expenses.approve') }}
              </button>
              <button v-if="e.status === 'pending'" class="text-caption text-danger hover:underline" @click="setStatus(e, 'rejected')">
                {{ $t('expenses.reject') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!pending && !error && filtered.length" class="tablet:hidden space-y-3">
      <div v-for="e in filtered" :key="e.id" class="rounded-lg border border-ink-100 dark:border-white/10 p-4" @click="openEdit(e)">
        <div class="flex items-center justify-between">
          <p class="font-medium">{{ formatAmount(e.amount, e.currency) }}</p>
          <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[e.status]">{{ $t(`expenses.status.${e.status}`) }}</span>
        </div>
        <p class="text-body-sm text-ink-400 mt-1">{{ $t(`expenses.category.${e.category}`) }} · {{ new Date(e.date).toLocaleDateString(locale) }}</p>
        <div v-if="e.status === 'pending'" class="flex gap-3 mt-2" @click.stop>
          <button class="text-caption text-success hover:underline" @click="setStatus(e, 'approved')">{{ $t('expenses.approve') }}</button>
          <button class="text-caption text-danger hover:underline" @click="setStatus(e, 'rejected')">{{ $t('expenses.reject') }}</button>
        </div>
      </div>
    </div>

    <!-- Load-more only applies to the unfiltered, server-paginated list — a
         status filter narrows only what's already loaded, same as elsewhere. -->
    <div v-if="!pending && !error && statusFilter === 'all' && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('expenses.loadingMore') : $t('expenses.loadMore') }}
      </button>
    </div>

    <ExpensesExpenseForm v-if="showForm" :expense="editingExpense" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
