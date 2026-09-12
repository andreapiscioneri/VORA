<script setup lang="ts">
import type { WelfareInitiative } from '~/shared/types/welfare'

definePageMeta({ layout: 'default' })

const { initiatives, pending, error, hasMore, loadingMore, fetchInitiatives, loadMore } = useWelfare()
await fetchInitiatives()

const showForm = ref(false)
const editingInitiative = ref<WelfareInitiative | null>(null)

function openNew() {
  editingInitiative.value = null
  showForm.value = true
}

function openEdit(initiative: WelfareInitiative) {
  editingInitiative.value = initiative
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingInitiative.value = null
}

const statusStyles: Record<string, string> = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('welfare.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('welfare.subtitle', { count: initiatives.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('welfare.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="initiatives.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('welfare.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('welfare.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('welfare.empty.cta') }}
      </button>
    </div>

    <div v-else class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
      <table class="w-full text-body-sm">
        <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">{{ $t('welfare.columns.title') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('welfare.columns.category') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('welfare.columns.enrolledCount') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('welfare.columns.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="i in initiatives"
            :key="i.id"
            class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 cursor-pointer"
            @click="openEdit(i)"
          >
            <td class="px-4 py-3 font-medium">{{ i.title }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ $t(`welfare.category.${i.category}`) }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ i.enrolledCount }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[i.status]">{{ $t(`welfare.status.${i.status}`) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!pending && !error && initiatives.length" class="tablet:hidden space-y-3">
      <button v-for="i in initiatives" :key="i.id" class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 p-4" @click="openEdit(i)">
        <p class="font-medium">{{ i.title }}</p>
        <p class="text-body-sm text-ink-400 mt-1">{{ $t(`welfare.category.${i.category}`) }} · {{ i.enrolledCount }}</p>
        <span class="inline-block mt-2 px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[i.status]">{{ $t(`welfare.status.${i.status}`) }}</span>
      </button>
    </div>

    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('welfare.loadingMore') : $t('welfare.loadMore') }}
      </button>
    </div>

    <WelfareForm v-if="showForm" :initiative="editingInitiative" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
